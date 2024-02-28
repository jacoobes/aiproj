from flask import Flask, render_template, redirect, url_for, session, request, Response, make_response
from flask_discord import DiscordOAuth2Session, requires_authorization, Unauthorized
from dotenv import load_dotenv
import sqlite3

import os
import subprocess

load_dotenv()
app = Flask(__name__)
app.secret_key = 'key'  # Change this to a secure secret key
app.config['DISCORD_CLIENT_ID'] = os.getenv('DISCORD_CLIENT_ID')
app.config['DISCORD_CLIENT_SECRET'] = os.getenv('DISCORD_CLIENT_SECRET')
app.config['DISCORD_REDIRECT_URI'] = 'http://127.0.0.1:5000/callback'  # Update with your redirect URI
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = os.getenv('OAUTHLIB_INSECURE_TRANSPORT')
discord = DiscordOAuth2Session(app)
# conn = sqlite3.connect('users.db')
# cursor = conn.cursor()

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

bot_started = False
pro = -1

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
# cursor.execute(create_users_table_sql)
# cursor.execute(create_table_sql)
# conn.commit()

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
    if discord.user_id:
        return redirect(url_for('.me'))
    return render_template('index.html')

@app.route("/login/")
def login():
    return discord.create_session(scopes=["identify", "email", "guilds", "guilds.join", "bot", "application.commands"])

@app.route("/logout/")
def logout():
    global pro
    discord.revoke()
    pro.send_signal(signal.CTRL_C_EVENT)
    response = Response()
    response.headers["hx-redirect"] = url_for(".home")
    return response

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
    url=f"https://discord.com/oauth2/authorize?client_id=1209527299024625726&permissions=8&scope=bot+applications.commands&guild_id={gid}"
    index_found = os.path.exists("indexes/"+gid+".db")
    html_body = "<p>Index found.</p>" if index_found else f'<a href="{url}">Invite</a>'
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
    global bot_started
    global pro
    user = discord.fetch_user()
    guilds = discord.fetch_guilds()
    if not bot_started: 
        pro = subprocess.Popen(["npm", "start"], cwd=".\\scraper\\", shell=True)
        bot_started = True
    return render_template("app.html", 
                           user=user,
                           guilds=guilds)

    return make_response('', 304)

if __name__ == "__main__":
    app.run(debug=True)
    # cursor.close()
    # conn.close()
