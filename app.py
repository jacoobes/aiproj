from flask import Flask, render_template, redirect, url_for, session, request
from flask_discord import DiscordOAuth2Session, requires_authorization, Unauthorized
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)
app.secret_key = 'key'  # Change this to a secure secret key
app.config['DISCORD_CLIENT_ID'] = os.getenv('DISCORD_CLIENT_ID')
app.config['DISCORD_CLIENT_SECRET'] = os.getenv('DISCORD_CLIENT_SECRET')
app.config['DISCORD_REDIRECT_URI'] = 'http://127.0.0.1:5000/callback'  # Update with your redirect URI
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = os.getenv('OAUTHLIB_INSECURE_TRANSPORT')
discord = DiscordOAuth2Session(app)

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
    return render_template("app.html", user=user, guilds=guilds)

if __name__ == "__main__":
    app.run(debug=True)
