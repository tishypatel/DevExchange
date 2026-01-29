from sqlmodel import Session, select
from main import User, Ticket, Comment, UserRole, TicketPriority, TicketStatus, engine, create_db_and_tables
from faker import Faker
import random
from datetime import datetime, timedelta
import os

fake = Faker()

def seed_data():
    # Remove old DB if exists to avoid schema conflicts during development
    if os.path.exists("database.db"):
        os.remove("database.db")
        print("🗑️  Deleted old database.db")

    print("🌱 Seeding Database...")
    create_db_and_tables()
    
    with Session(engine) as session:
        # 1. Create Key Users
        print("Creating Users...")
        admin = User(
            username="boss", 
            password="123", 
            role=UserRole.ADMIN, 
            full_name="Big Boss", 
            email="admin@devexchange.com", 
            bio="System Administrator",
            reputation=1000,
            is_active=True
        )
        session.add(admin)
        
        intern = User(
            username="intern", 
            password="123", 
            role=UserRole.USER, 
            full_name="New Hire", 
            email="intern@devexchange.com", 
            bio="Learning the ropes",
            reputation=50,
            is_active=True
        )
        session.add(intern)
        
        # Create 10 random users
        users = [admin, intern]
        for _ in range(10):
            u = User(
                username=fake.user_name(),
                password="123",
                role=random.choice([UserRole.USER, UserRole.MANAGER]),
                full_name=fake.name(),
                email=fake.email(),
                bio=fake.sentence(),
                reputation=random.randint(0, 500),
                is_active=True
            )
            session.add(u)
            users.append(u)
        
        session.commit()
        
        # Refresh users to get IDs
        for u in users: session.refresh(u)

        # 2. Create 100 Tickets
        print("Creating 100 Tickets...")
        priorities = list(TicketPriority)
        statuses = list(TicketStatus)
        tags_list = ["python", "react", "docker", "bug", "feature", "deployment", "css", "api", "database", "nextjs"]

        tickets = []
        for i in range(100):
            # Create a realistic date in the past 30 days
            created_date = datetime.utcnow() - timedelta(days=random.randint(0, 30))
            
            t = Ticket(
                title=fake.sentence(nb_words=6).replace(".", ""),
                description=fake.paragraph(nb_sentences=3),
                priority=random.choice(priorities),
                status=random.choice(statuses),
                tags=f"{random.choice(tags_list)}, {random.choice(tags_list)}",
                created_at=created_date,
                owner_id=random.choice(users).id
            )
            session.add(t)
            tickets.append(t)
        
        session.commit()
        for t in tickets: session.refresh(t)

        # 3. Create Comments
        print("Adding Comments...")
        for t in tickets:
            # 70% chance a ticket has comments
            if random.choice([True, True, False]):
                for _ in range(random.randint(1, 6)):
                    has_attachment = random.choice([True, False, False, False]) # 25% chance
                    
                    c = Comment(
                        content=fake.paragraph(nb_sentences=2),
                        created_at=t.created_at + timedelta(hours=random.randint(1, 48)),
                        ticket_id=t.id,
                        author_id=random.choice(users).id,
                        attachment_url="https://picsum.photos/400/300" if has_attachment else None
                    )
                    session.add(c)

        session.commit()
        print("✅ Database Populated Successfully!")
        print(f"   - {len(users)} Users")
        print(f"   - {len(tickets)} Tickets")

if __name__ == "__main__":
    seed_data()