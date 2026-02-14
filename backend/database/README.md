# How to Import the Database Schema in phpMyAdmin

Follow these steps to set up your database:

## Step 1: Access phpMyAdmin
1. Open your browser and go to `http://localhost/phpmyadmin`
2. Login with your credentials (usually username: `root`, password: empty or `root`)

## Step 2: Select the Database
1. In the left sidebar, click on the database **`bdStage`** (since you already created it)
2. If you haven't created it yet:
   - Click "New" in the left sidebar
   - Enter database name: `bdStage`
   - Choose collation: `utf8mb4_unicode_ci`
   - Click "Create"

## Step 3: Import the Schema
1. Click on the **`bdStage`** database in the left sidebar
2. Click the **"SQL"** tab at the top
3. Open the file `backend/database/schema.sql` in a text editor
4. Copy all the SQL code
5. Paste it into the SQL query box in phpMyAdmin
6. Click **"Go"** button at the bottom right

## Step 4: Verify Tables Created
After running the SQL, you should see three new tables in the left sidebar:
- ✅ `users`
- ✅ `chat_conversations`
- ✅ `chat_messages`

## Step 5: Check Table Structure (Optional)
Click on each table name to view its structure and confirm:
- **users**: id, name, email, password_hash, created_at, updated_at
- **chat_conversations**: id, user_id, title, created_at, updated_at
- **chat_messages**: id, conversation_id, role, content, timestamp

## Troubleshooting
- If you get an error about foreign keys, make sure you're using InnoDB engine
- If tables already exist, you can drop them first or the script will skip creating them
- Make sure your MySQL version supports utf8mb4 (MySQL 5.5.3+)

---

✅ Once you see all three tables, the database setup is complete!
