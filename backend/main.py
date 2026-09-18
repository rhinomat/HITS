from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Field, SQLModel, create_engine, Session, select

class Item(SQLModel, table=True):
    id:Optional[int] = Field(default=None, primary_key=True)
    name: str
    location: str
    category: str
    quantity: int = 1

sqlite_url = "sqlite:///./inventory.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

app = FastAPI()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/items", response_model=List[Item])
def read_items(session: Session = Depends(get_session)):
    return session.exec(select(Item)).all()

@app.post("/items", response_model=Item)
def create_item(item: Item, session: Session = Depends(get_session)):
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@app.put("/items/{item_id}", response_model=Item)
def update_item(item_id: int, update_item: Item, session: Session = Depends(get_session)):
    db_item = session.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    item_data = update_item.model_dump(exclude_unset=True)
    for key, value in item_data.items():
        setattr(db_item, key, value)

    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@app.delete("/items/{item_id}")
def delete_item(item_id: int, session: Session = Depends(get_session)):
    db_item = session.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    session.delete(db_item)
    session.commit()
    return {"message": "Deleted successfully"}

