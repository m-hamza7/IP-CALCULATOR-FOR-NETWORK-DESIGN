from flask import Flask, render_template, request, jsonify
import ipaddress
import sqlite3
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)

# Simulated database for organizations and their assigned subnets
organizations = {}

@app.route('/')
def home():
    return render_template('home.html')



# Database setup
def init_db():
    with sqlite3.connect("subnet_manager.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subnets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                org_id INTEGER,
                subnet TEXT UNIQUE NOT NULL,
                FOREIGN KEY (org_id) REFERENCES organizations(id)
            )
        """)
        conn.commit()

init_db()
@app.route('/subnet_assignment')
def subnet_assignment():
    return render_template('index.html')

@app.route('/existing_organizations')
def existing_organizations():
    with sqlite3.connect("subnet_manager.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM organizations")
        orgs = cursor.fetchall()
    return render_template('existing_org.html', organizations=orgs)



# Register a new organization
@app.route("/register_org", methods=["POST"])
def register_org():
    data = request.get_json()
    org_name = data.get("org_name")

    if not org_name:
        return jsonify({"error": "Organization name is required"}), 400

    try:
        with sqlite3.connect("subnet_manager.db") as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO organizations (name) VALUES (?)", (org_name,))
            conn.commit()
        return jsonify({"message": f"Organization '{org_name}' registered successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Organization already exists"}), 400

# Subnet allocation with overlap detection
@app.route("/calculate", methods=["POST"])
def calculate():
    try:
        data = request.get_json()
        ip_address = data.get("ip_address")
        subnet_mask = data.get("subnet_mask")
        org_name = data.get("org_name")

        if not ip_address or not subnet_mask or not org_name:
            return jsonify({"error": "Missing required fields"}), 400

        with sqlite3.connect("subnet_manager.db") as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM organizations WHERE name=?", (org_name,))
            org = cursor.fetchone()
            if not org:
                return jsonify({"error": "Organization not found"}), 404

            org_id = org[0]
            network = ipaddress.IPv4Network(f"{ip_address}/{subnet_mask}", strict=False)

            # Check for subnet overlap
            cursor.execute("SELECT subnet FROM subnets WHERE org_id=?", (org_id,))
            existing_subnets = [ipaddress.IPv4Network(row[0]) for row in cursor.fetchall()]
            for existing in existing_subnets:
                if existing.overlaps(network):
                    return jsonify({"error": "Subnet overlaps with an existing allocation"}), 400

            # Store the new subnet
            cursor.execute("INSERT INTO subnets (org_id, subnet) VALUES (?, ?)", (org_id, str(network)))
            conn.commit()

        response = {
            "network_address": str(network.network_address),
            "first_usable_ip": str(list(network.hosts())[0]) if network.num_addresses > 2 else "N/A",
            "last_usable_ip": str(list(network.hosts())[-1]) if network.num_addresses > 2 else "N/A",
            "broadcast_address": str(network.broadcast_address),
            "total_hosts": network.num_addresses - 2,
            "organization": org_name,
            "assigned_subnet": str(network)
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Export assigned subnets
@app.route("/export_subnets", methods=["GET"])
def export_subnets():
    with sqlite3.connect("subnet_manager.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT organizations.name, subnets.subnet 
            FROM subnets 
            JOIN organizations ON subnets.org_id = organizations.id
        """)
        result = [{"organization": row[0], "subnet": row[1]} for row in cursor.fetchall()]

    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)

