from flask import Flask, render_template, redirect, url_for, session
from flask_discord import DiscordOAuth2Session, requires_authorization, Unauthorized
import os

app = Flask(__name__)
app.secret_key = 'key'  # Change this to a secure secret key
app.config['DISCORD_CLIENT_ID'] = '1209527299024625726'
app.config['DISCORD_CLIENT_SECRET'] = 'nRlamvFUA1SevXiI5dJ4TB6wbjv3vLTx'
app.config['DISCORD_REDIRECT_URI'] = 'http://localhost:5000/callback'  # Update with your redirect URI
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
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

	
@app.route("/me/")
@requires_authorization
def me():
    user = discord.fetch_user()
    return f"""
    <html>
        <head>
            <title>{user.name}</title>
        </head>
        <body>
            <img src='{user.avatar_url}' />
        </body>
    </html>"""


if __name__ == "__main__":
    app.run(debug=True)
