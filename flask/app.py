from flask import Flask, render_template, jsonify
from flask_cors import CORS, cross_origin
import json

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'

cors = CORS(app, resources = {r"/": {"orgins": "https://localhost:8000"}})

@app.route('/', methods=['POST', 'GET'])
@cross_origin(origin='localhost', headers=['Content-Type', 'Authorization'])
def index():
    data = json.load(open("test.json"))
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)