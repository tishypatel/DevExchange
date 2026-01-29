from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status, Query, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel, Field, Session, select, create_engine, Relationship, or_
from enum import Enum
from typing import Optional, List, Dict
from jose import JWTError, jwt
import uuid
import shutil
import os
import json

# --- CONFIGURATION ---
SECRET_KEY = "super_secret_key_change_me_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
SQLITE_FILE_NAME = "database.db"
SQLITE_URL = f"sqlite:///{SQLITE_FILE_NAME}"

# --- DATABASE SETUP ---
engine = create_engine(SQLITE_URL, echo=False)

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# --- WEBSOCKET MANAGER (MULTI-TAB SUPPORT) ---
class ConnectionManager:
    def __init__(self):
        # Ticket Chat Rooms: ticket_id -> List[WebSocket]
        self.ticket_connections: Dict[str, List[WebSocket]] = {}
        # User Notifications: user_id -> List[WebSocket] (Supports multiple tabs)
        self.user_connections: Dict[str, List[WebSocket]] = {}

    # --- TICKET LOGIC ---
    async def connect_ticket(self, websocket: WebSocket, ticket_id: str):
        await websocket.accept()
        if ticket_id not in self.ticket_connections:
            self.ticket_connections[ticket_id] = []
        self.ticket_connections[ticket_id].append(websocket)
        print(f"[WS] Ticket {ticket_id}: Client connected. Total: {len(self.ticket_connections[ticket_id])}")

    def disconnect_ticket(self, websocket: WebSocket, ticket_id: str):
        if ticket_id in self.ticket_connections:
            if websocket in self.ticket_connections[ticket_id]:
                self.ticket_connections[ticket_id].remove(websocket)
                if not self.ticket_connections[ticket_id]:
                    del self.ticket_connections[ticket_id]
        print(f"[WS] Ticket {ticket_id}: Client disconnected.")

    async def broadcast_ticket(self, ticket_id: str, message: dict):
        if ticket_id in self.ticket_connections:
            # Iterate over a copy to handle disconnects safely
            for connection in self.ticket_connections[ticket_id][:]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"[WS] Error sending to ticket {ticket_id}: {e}")
                    # Optionally remove dead connection here if needed

    # --- USER NOTIFICATION LOGIC ---
    async def connect_user(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)
        print(f"[WS] User {user_id}: Notification channel connected. Total tabs: {len(self.user_connections[user_id])}")

    def disconnect_user(self, websocket: WebSocket, user_id: str):
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
        print(f"[WS] User {user_id}: Notification channel disconnected.")

    async def send_personal_message(self, user_id: str, message: dict):
        if user_id in self.user_connections:
            print(f"[WS] Sending notification to User {user_id} (Active tabs: {len(self.user_connections[user_id])})")
            # Iterate over a copy of the list [:] to avoid modification errors during iteration
            for connection in self.user_connections[user_id][:]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"[WS] Error sending to user {user_id}: {e}")
                    # If sending fails, assume socket is dead and remove it
                    try:
                        self.user_connections[user_id].remove(connection)
                    except ValueError:
                        pass
        else:
            print(f"[WS] User {user_id} is offline. Notification skipped.")

manager = ConnectionManager()

# --- ENUMS ---
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"

class TicketPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TicketStatus(str, Enum):
    OPEN = "open"
    SOLVED = "solved"

# --- MODELS ---
class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    username: str = Field(index=True, unique=True)
    password: str 
    role: UserRole
    full_name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool = True 
    reputation: int = Field(default=0)
    
    tickets: List["Ticket"] = Relationship(back_populates="owner")
    comments: List["Comment"] = Relationship(back_populates="author")
    notifications: List["Notification"] = Relationship(back_populates="recipient")

class Ticket(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    tags: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    owner_id: Optional[str] = Field(default=None, foreign_key="user.id")
    owner: Optional[User] = Relationship(back_populates="tickets")
    comments: List["Comment"] = Relationship(back_populates="ticket")

class Comment(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    attachment_url: Optional[str] = None
    author_id: Optional[str] = Field(default=None, foreign_key="user.id")
    author: Optional[User] = Relationship(back_populates="comments")
    ticket_id: Optional[str] = Field(default=None, foreign_key="ticket.id")
    ticket: Optional[Ticket] = Relationship(back_populates="comments")

class Notification(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    recipient_id: str = Field(foreign_key="user.id")
    content: str
    link: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    recipient: Optional[User] = Relationship(back_populates="notifications")

# --- DTOs ---
class UserRead(SQLModel):
    id: str
    username: str
    role: UserRole
    full_name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    reputation: int
    is_active: bool

class TicketCreate(SQLModel):
    title: str
    description: str
    priority: TicketPriority
    tags: str

class TicketUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    tags: Optional[str] = None

class TicketRead(SQLModel):
    id: str
    title: str
    description: str
    priority: TicketPriority
    status: TicketStatus
    tags: str
    created_at: datetime
    owner_name: str
    owner_id: str
    owner_email: Optional[str] = None

class CommentCreate(SQLModel):
    content: str
    attachment_url: Optional[str] = None

class CommentRead(SQLModel):
    id: str
    content: str
    attachment_url: Optional[str] = None
    created_at: datetime
    author_name: str
    author_role: str

class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None

class LoginRequest(SQLModel):
    username: str
    password: str

class Token(SQLModel):
    access_token: str
    token_type: str
    role: str

class DeleteRequest(SQLModel):
    ids: List[str]

class NotificationRead(SQLModel):
    id: str
    content: str
    link: str
    is_read: bool
    created_at: datetime

# --- APP SETUP ---
app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- HELPER FUNCTIONS ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if user is None: raise HTTPException(status_code=401)
    return user

# --- ROUTES ---

@app.get("/users", response_model=List[UserRead])
def read_users(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    users = session.exec(select(User)).all()
    return users

@app.post("/users", response_model=User)
def create_user(user: User, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == user.username)
    if session.exec(statement).first():
        raise HTTPException(status_code=400, detail="Username taken")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.post("/users/bulk-delete") 
def delete_users_bulk(
    delete_req: DeleteRequest, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    statement = select(User).where(User.id.in_(delete_req.ids))
    users = session.exec(statement).all()
    for user in users: session.delete(user)
    session.commit()
    return {"ok": True, "deleted_count": len(users)}

@app.delete("/users/{user_id}")
def delete_user(
    user_id: str, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = session.get(User, user_id)
    if not user: raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"ok": True}

@app.post("/login", response_model=Token)
def login(login_data: LoginRequest, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == login_data.username)
    user = session.exec(statement).first()
    if not user or user.password != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_access_token({"sub": user.username, "role": user.role}), "token_type": "bearer", "role": user.role}

@app.get("/users/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.patch("/users/me", response_model=User)
def update_user_me(user_update: UserUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    user_data = user_update.dict(exclude_unset=True)
    for key, value in user_data.items():
        setattr(current_user, key, value)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user 

@app.get("/leaderboard", response_model=List[UserRead])
def read_leaderboard(session: Session = Depends(get_session)):
    users = session.exec(select(User).order_by(User.reputation.desc()).limit(10)).all()
    return users

# --- TICKET ROUTES ---

@app.post("/tickets", response_model=Ticket)
def create_ticket(ticket: TicketCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    db_ticket = Ticket.from_orm(ticket)
    db_ticket.owner_id = current_user.id
    session.add(db_ticket)
    current_user.reputation += 10
    session.add(current_user)
    session.commit()
    session.refresh(db_ticket)
    return db_ticket

@app.get("/tickets", response_model=List[TicketRead])
def read_tickets(
    session: Session = Depends(get_session),
    q: Optional[str] = None,
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    owner_id: Optional[str] = None
):
    query = select(Ticket)
    if status: query = query.where(Ticket.status == status)
    if priority: query = query.where(Ticket.priority == priority)
    if owner_id: query = query.where(Ticket.owner_id == owner_id)
    if q: query = query.where(or_(Ticket.title.contains(q), Ticket.description.contains(q)))
    query = query.order_by(Ticket.created_at.desc())
    tickets = session.exec(query).all()
    
    return [
        TicketRead(
            id=t.id, title=t.title, description=t.description,
            priority=t.priority, status=t.status, tags=t.tags,
            created_at=t.created_at,
            owner_name=t.owner.username if t.owner else "Unknown",
            owner_id=t.owner_id,
            owner_email=t.owner.email if t.owner else None
        ) for t in tickets
    ]

@app.get("/tickets/{ticket_id}", response_model=TicketRead)
def read_ticket_detail(ticket_id: str, session: Session = Depends(get_session)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket: raise HTTPException(status_code=404)
    return TicketRead(
        id=ticket.id, title=ticket.title, description=ticket.description,
        priority=ticket.priority, status=ticket.status, tags=ticket.tags,
        created_at=ticket.created_at,
        owner_name=ticket.owner.username if ticket.owner else "Unknown",
        owner_id=ticket.owner_id,
        owner_email=ticket.owner.email if ticket.owner else None
    )

@app.patch("/tickets/{ticket_id}", response_model=Ticket)
def update_ticket(
    ticket_id: str, 
    ticket_update: dict, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    ticket = session.get(Ticket, ticket_id)
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    # --- PERMISSION CHECK ---
    # Only Admin OR Ticket Owner can edit/resolve
    if current_user.role != UserRole.ADMIN and ticket.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to manage this ticket.")
    
    if "status" in ticket_update:
        if ticket_update["status"] == "solved" and ticket.status != "solved":
             current_user.reputation += 20
             session.add(current_user)
        ticket.status = ticket_update["status"]
        
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket

# --- COMMENT, UPLOAD & NOTIFICATION ROUTES ---

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = f"static/{file_name}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"http://localhost:8000/static/{file_name}"}

@app.post("/tickets/{ticket_id}/comments", response_model=CommentRead)
async def create_comment(
    ticket_id: str, 
    comment: CommentCreate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    ticket = session.get(Ticket, ticket_id)
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    db_comment = Comment(
        content=comment.content,
        attachment_url=comment.attachment_url,
        ticket_id=ticket_id,
        author_id=current_user.id
    )
    session.add(db_comment)
    
    current_user.reputation += 5
    session.add(current_user)
    
    # Notify owner (if not same person)
    if ticket.owner_id and ticket.owner_id != current_user.id:
        notif = Notification(
            recipient_id=ticket.owner_id,
            content=f"{current_user.username} commented on your ticket: {ticket.title}",
            link=f"/dashboard/tickets/{ticket.id}"
        )
        session.add(notif)
        session.commit()
        session.refresh(notif)
        
        # Send to ALL active connections for this user
        await manager.send_personal_message(ticket.owner_id, {
            "type": "notification",
            "content": notif.content,
            "link": notif.link
        })

    session.commit()
    session.refresh(db_comment)
    
    # Convert to DTO
    response_dto = CommentRead(
        id=db_comment.id, 
        content=db_comment.content, 
        attachment_url=db_comment.attachment_url,
        created_at=db_comment.created_at,
        author_name=current_user.username, 
        author_role=current_user.role
    )
    
    ws_data = response_dto.dict()
    ws_data['created_at'] = ws_data['created_at'].isoformat()
    ws_data['type'] = 'chat'
    await manager.broadcast_ticket(ticket_id, ws_data)
    
    return response_dto

@app.get("/tickets/{ticket_id}/comments", response_model=List[CommentRead])
def read_comments(ticket_id: str, session: Session = Depends(get_session)):
    comments = session.exec(select(Comment).where(Comment.ticket_id == ticket_id).order_by(Comment.created_at.asc())).all()
    return [
        CommentRead(
            id=c.id, content=c.content, attachment_url=c.attachment_url, created_at=c.created_at,
            author_name=c.author.username if c.author else "Unknown",
            author_role=c.author.role if c.author else "user"
        ) for c in comments
    ]

@app.get("/notifications", response_model=List[NotificationRead])
def read_notifications(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return session.exec(select(Notification).where(Notification.recipient_id == current_user.id).order_by(Notification.created_at.desc())).all()

@app.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    notif = session.get(Notification, notif_id)
    if not notif or notif.recipient_id != current_user.id:
        raise HTTPException(status_code=404)
    notif.is_read = True
    session.add(notif)
    session.commit()
    return {"ok": True}

@app.websocket("/ws/ticket/{ticket_id}")
async def websocket_ticket(websocket: WebSocket, ticket_id: str):
    await manager.connect_ticket(websocket, ticket_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_ticket(websocket, ticket_id)

@app.websocket("/ws/user/{user_id}")
async def websocket_user(websocket: WebSocket, user_id: str):
    await manager.connect_user(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_user(websocket, user_id)