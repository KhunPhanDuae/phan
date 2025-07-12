from flask import Flask, render_template, request, redirect, url_for, flash
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_strong_secret_key_here' # ကိုယ်ပိုင် ခိုင်မာတဲ့ key တစ်ခုပြောင်းပါ
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db' # SQLite Database
db = SQLAlchemy(app)
socketio = SocketIO(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login' # Login မလုပ်ရသေးရင် ဒီ route ကိုပို့ပါ

# --- Database Models ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    # user နဲ့ chat room ကြား many-to-many relationship
    rooms = db.relationship('Room', secondary='user_room', backref='users')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    messages = db.relationship('Message', backref='room', lazy=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.now())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('messages', lazy=True))

# Many-to-Many association table for User and Room
user_room = db.Table('user_room',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('room_id', db.Integer, db.ForeignKey('room.id'), primary_key=True)
)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Routes ---

@app.before_first_request
def create_tables():
    db.create_all()
    # ဥပမာ room တစ်ခု ဖန်တီးပါ
    if not Room.query.filter_by(name='General').first():
        general_room = Room(name='General')
        db.session.add(general_room)
        db.session.commit()

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            flash('Login အောင်မြင်ပါသည်!', 'success')
            return redirect(url_for('index'))
        else:
            flash('အမည် သို့မဟုတ် စကားဝှက် မှားယွင်းပါသည်.', 'danger')
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if User.query.filter_by(username=username).first():
            flash('ဤအသုံးပြုသူအမည် ရှိနှင့်ပြီးသား ဖြစ်ပါသည်.', 'danger')
        else:
            new_user = User(username=username)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            flash('အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်! ကျေးဇူးပြု၍ Login ဝင်ပါ.', 'success')
            return redirect(url_for('login'))
    return render_template('signup.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('သင်ထွက်ခွာပြီးပါပြီ.', 'info')
    return redirect(url_for('login'))

@app.route('/')
@login_required # Login လုပ်ထားမှ ဝင်ခွင့်ပြုပါမယ်
def index():
    # User ဝင်နိုင်တဲ့ rooms တွေ ရွေးပါ
    # ဥပမာ: အားလုံးကို ပြန်ပေးပါ
    rooms = Room.query.all()
    return render_template('index.html', rooms=rooms)

@app.route('/room/<int:room_id>')
@login_required
def chat_room(room_id):
    room = Room.query.get_or_404(room_id)
    # အသုံးပြုသူ ဒီ room ထဲမှာ ပါဝင်မှု ရှိမရှိ စစ်ဆေးနိုင်ပါတယ်
    # ဥပမာ: if current_user not in room.users:
    #             flash("You are not part of this room.", "danger")
    #             return redirect(url_for('index'))

    # အရင်က မက်ဆေ့ချ်တွေကို database ကနေ ယူပါ
    messages = Message.query.filter_by(room_id=room_id).order_by(Message.timestamp.asc()).all()
    return render_template('chat_room.html', room=room, messages=messages, current_user=current_user)

# --- SocketIO Events ---
@socketio.on('connect')
@login_required # SocketIO connect ကိုလည်း Login လုပ်ထားမှ ခွင့်ပြုပါမယ်
def on_connect():
    print(f'Client connected: {current_user.username}')
    # client ချိတ်ဆက်လာတဲ့အခါ သူ့ရဲ့ user ID ကို session မှာ သိမ်းထားနိုင်ပါတယ်
    # flask.session['user_id'] = current_user.id

@socketio.on('disconnect')
def on_disconnect():
    print('Client disconnected')

@socketio.on('join')
@login_required
def on_join(data):
    room_id = data['room_id']
    room = Room.query.get(room_id)
    if room:
        join_room(room.name) # SocketIO room ကို join ပါ
        # ဥပမာ: "user_name has entered the room" လို မက်ဆေ့ချ်ပို့နိုင်ပါတယ်
        emit('status_message', {'msg': f'{current_user.username} chat room ထဲသို့ ဝင်ရောက်လာပါပြီ။', 'room_id': room_id}, room=room.name)
        print(f'{current_user.username} joined room {room.name}')
    else:
        print(f"Room with ID {room_id} not found.")

@socketio.on('leave')
@login_required
def on_leave(data):
    room_id = data['room_id']
    room = Room.query.get(room_id)
    if room:
        leave_room(room.name)
        emit('status_message', {'msg': f'{current_user.username} chat room မှ ထွက်ခွာသွားပါပြီ။', 'room_id': room_id}, room=room.name)
        print(f'{current_user.username} left room {room.name}')

@socketio.on('send_message')
@login_required
def handle_message(data):
    room_id = data['room_id']
    message_content = data['message']
    
    room = Room.query.get(room_id)
    if not room:
        print(f"Error: Room {room_id} not found for message.")
        return

    # Message ကို Database ထဲ ထည့်ပါ
    new_message = Message(content=message_content, user_id=current_user.id, room_id=room_id)
    db.session.add(new_message)
    db.session.commit()

    # Chat Room ထဲက အားလုံးဆီ မက်ဆေ့ချ် ပို့ပါ
    emit('receive_message', {
        'username': current_user.username,
        'message': message_content,
        'room_id': room_id,
        'timestamp': new_message.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    }, room=room.name)
    print(f'Message to room {room.name} from {current_user.username}: {message_content}')

if __name__ == '__main__':
    socketio.run(app, debug=True)