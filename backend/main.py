from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Gauge
from typing import List, Optional
import time

from database import Base, engine, get_db
from models import Todo
from schemas import TodoCreate, TodoUpdate, TodoResponse

# DB 테이블 생성 (재시도 포함)
import time as _time

for attempt in range(10):
    try:
        Base.metadata.create_all(bind=engine)
        break
    except Exception:
        if attempt == 9:
            raise
        _time.sleep(3)

app = FastAPI(title="TODO API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus 메트릭 설정
Instrumentator().instrument(app).expose(app)

# 커스텀 메트릭
todo_total_gauge = Gauge("todo_total", "Total number of todos")
todo_completed_gauge = Gauge("todo_completed_total", "Number of completed todos")


def update_todo_metrics(db: Session):
    total = db.query(Todo).count()
    completed = db.query(Todo).filter(Todo.completed == True).count()
    todo_total_gauge.set(total)
    todo_completed_gauge.set(completed)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/todos", response_model=List[TodoResponse])
def get_todos(
    completed: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Todo)
    if completed is not None:
        query = query.filter(Todo.completed == completed)
    return query.order_by(Todo.created_at.desc()).all()


@app.post("/api/todos", response_model=TodoResponse, status_code=201)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    db_todo = Todo(title=todo.title)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    update_todo_metrics(db)
    return db_todo


@app.put("/api/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, todo: TodoUpdate, db: Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.title is not None:
        db_todo.title = todo.title
    if todo.completed is not None:
        db_todo.completed = todo.completed
    db.commit()
    db.refresh(db_todo)
    update_todo_metrics(db)
    return db_todo


@app.delete("/api/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    update_todo_metrics(db)


@app.delete("/api/todos", status_code=204)
def delete_completed_todos(db: Session = Depends(get_db)):
    db.query(Todo).filter(Todo.completed == True).delete()
    db.commit()
    update_todo_metrics(db)
