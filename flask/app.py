from flask import Flask, render_template, jsonify
from flask_cors import CORS, cross_origin
from selenium import webdriver
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import json
import requests

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'

driver = webdriver.Firefox(executable_path="./geckodriver.exe")
driver.get("https://www.ahd.com/states/hospital_CA.html")
geolocator = Nominatim(user_agent="app", timeout=5)
hospital_name = driver.find_elements_by_xpath('//td[@align="left"]')
hospital_data = driver.find_elements_by_xpath('//td[@align="right"]')
# dataset = {"hospitals": []}

def do_geocode(address):
    try:
        return geolocator.geocode(address)
    except GeocoderTimedOut:
        return do_geocode(address)

# j = 0
# for i in range(len(hospital_name) - 1):
#     location = do_geocode(hospital_data[(i * 5) + 0].text)
#     URL = "https://geo.fcc.gov/api/census/area?lat="+ str(location.latitude) + "&lon=" + str(location.longitude) + "&format=json"
#     r = requests.get(url = URL).json()
#     if (len(r["results"]) > 0):
#         dataset["hospitals"].append({})
#         dataset["hospitals"][i - j]["name"] = hospital_name[i - j].text
#         dataset["hospitals"][i - j]["city"] = hospital_data[((i - j) * 5) + 0].text
#         dataset["hospitals"][i - j]["county"] = r["results"][0]["county_name"]
#         dataset["hospitals"][i - j]["staffedBeds"] = hospital_data[((i - j) * 5) + 1].text
#         dataset["hospitals"][i - j]["totalDischarges"] = hospital_data[((i - j) * 5) + 2].text
#         dataset["hospitals"][i - j]["patientDays"] = hospital_data[((i - j) * 5) + 3].text
#         dataset["hospitals"][i - j]["grossPatientRevenue"] = hospital_data[((i - j) * 5) + 4].text
#     else:
#         j += 1

cors = CORS(app, resources = {r"/": {"orgins": "https://localhost:5000"}})
cors = CORS(app, resources = {r"/hospitalCA": {"orgins": "https://localhost:5000"}})
cors = CORS(app, resources = {r"/hospitalCA_CTY": {"orgins": "https://localhost:5000"}})

@app.route('/', methods=['POST', 'GET'])
@cross_origin(origin='localhost', headers=['Content-Type', 'Authorization'])
def index():
    data = json.load(open("test.json"))
    return jsonify(data)

@app.route('/hospitalCA', methods=['GET'])
@cross_origin(origin='localhost', headers=['Content-Type', 'Authorization'])
def hospitalCA():
    return jsonify(dataset)

@app.route('/hospitalCA_CTY', methods=['GET'])
@cross_origin(origin='localhost', headers=['Content-Type', 'Authorization'])
def hospitalCA_CTY():
    dataset = json.load(open("hospital.json"))
    cty_data = {"data": {}}
    for i in range(len(dataset["hospitals"])):
        if (dataset["hospitals"][i]["county"] not in cty_data["data"]):
            cty_data["data"][dataset["hospitals"][i]["county"]] = {}
            cty_data["data"][dataset["hospitals"][i]["county"]]["CTYNAME"] = dataset["hospitals"][i]["county"]
            cty_data["data"][dataset["hospitals"][i]["county"]]["staffedBeds"] = int(dataset["hospitals"][i]["staffedBeds"])
        else:
            cty_data["data"][dataset["hospitals"][i]["county"]]["staffedBeds"] += int(dataset["hospitals"][i]["staffedBeds"])
    return jsonify(cty_data)

if __name__ == "__main__":
    app.run(debug=True)