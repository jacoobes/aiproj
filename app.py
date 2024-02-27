from flask import Flask, render_template, redirect, url_for, session, request
from flask_discord import DiscordOAuth2Session, requires_authorization, Unauthorized
from dotenv import load_dotenv
import sqlite3
import os

load_dotenv()
app = Flask(__name__)
app.secret_key = 'key'  # Change this to a secure secret key
app.config['DISCORD_CLIENT_ID'] = os.getenv('DISCORD_CLIENT_ID')
app.config['DISCORD_CLIENT_SECRET'] = os.getenv('DISCORD_CLIENT_SECRET')
app.config['DISCORD_REDIRECT_URI'] = 'http://127.0.0.1:5000/callback'  # Update with your redirect URI
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = os.getenv('OAUTHLIB_INSECURE_TRANSPORT')
discord = DiscordOAuth2Session(app)
conn = sqlite3.connect('users.db')
cursor = conn.cursor()

create_table_sql = '''
CREATE TABLE IF NOT EXISTS guilds (
    guild_id TEXT PRIMARY KEY,
    user_id TEXT
);
'''

create_users_table_sql = '''
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY
);
'''

cursor.execute(create_users_table_sql)
cursor.execute(create_table_sql)
conn.commit()


def insert_guild_user(guild_id, user_id):
    insert_sql = '''
    INSERT INTO guilds (guild_id, user_id) VALUES (?, ?)
    '''
    cursor.execute(insert_sql, (guild_id, user_id))
    conn.commit()

def get_user_id(guild_id):
    select_sql = '''
    SELECT user_id FROM guilds WHERE guild_id = ?
    '''
    cursor.execute(select_sql, (guild_id,))
    result = cursor.fetchone()
    return result[0] if result else None

@app.route('/')
def home():
    return render_template('index.html')

@app.route("/login/")
def login():
    return discord.create_session()
	

@app.route("/callback/")
def callback():
    discord.callback()
    return redirect(url_for(".me"))


@app.errorhandler(Unauthorized)
def redirect_unauthorized(e):
    return redirect(url_for("login"))


@app.route('/search', methods=['POST'])
@requires_authorization
def search():
    search_term = request.form['search_term']
    return "Search Term: " + search_term

@app.route("/me/")
@requires_authorization
def me():
    user = discord.fetch_user()
    guilds = discord.fetch_guilds()
    for guild in guilds:
        print(guild.id)

    return render_template("app.html", user=user, guilds=guilds)

if __name__ == "__main__":
    app.run(debug=True)
    cursor.close()
    conn.close()
