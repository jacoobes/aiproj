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


def create_folder_if_not_exists(folder_path):
    """
    Create a folder if it doesn't exist.

    Parameters:
        folder_path (str): Path of the folder to create.
    """
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        print(f"Folder '{folder_path}' created.")
    else:
        print(f"Folder '{folder_path}' already exists.")

create_folder_if_not_exists("indexes")
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
    return render_template('index.html', discord=discord)

@app.route("/login/")
def login():
    return discord.create_session()

@app.route("/logout/")
def logout():
    discord.revoke()
    return redirect(url_for(".home"))

@app.route("/callback/")
def callback():
    discord.callback()
    return redirect(url_for(".me"))

@app.errorhandler(Unauthorized)
def redirect_unauthorized(e):
    return redirect(url_for("login"))

@app.route("/guildselect", methods=["POST"])
@requires_authorization
def guildselect():
    gid = str(request.form['guilds'])
    found = None
    for g in discord.fetch_guilds():
        if str(g.id) == gid:
            found = g

    if not found:
        return """<h2 class="selected-guild">Unknown Guild</h2>"""
    print(discord.request("/channels/640980255267356722/messages"))
    index_found = os.path.exists("indexes/"+gid+".db")
    html_body = "<p>Index found.</p>" if index_found else '<input type="submit" value="Index">'
    return f"""
        <h2 class="selected-guild">{found.name}</h2>
        {html_body}
    """

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

    return render_template("app.html", user=user, guilds=guilds)

#@app.route("/index/<name>")
#@requires_authorization
#def index(name=None):
#    
#    pass

if __name__ == "__main__":
    app.run(debug=True)
    cursor.close()
    conn.close()
