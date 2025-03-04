from flask import Flask, render_template, request, jsonify
import ipaddress

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        ip_address = data.get('ip_address')
        subnet_mask = data.get('subnet_mask')

        if not ip_address or not subnet_mask:
            return jsonify({"error": "Missing IP Address or Subnet Mask"}), 400

        try:
            network = ipaddress.IPv4Network(f"{ip_address}/{subnet_mask}", strict=False)
        except ValueError:
            return jsonify({"error": "Invalid IP or Subnet Mask"}), 400

        response = {
            "network_address": str(network.network_address),
            "first_usable_ip": str(list(network.hosts())[0]) if network.num_addresses > 2 else "N/A",
            "last_usable_ip": str(list(network.hosts())[-1]) if network.num_addresses > 2 else "N/A",
            "broadcast_address": str(network.broadcast_address),
            "total_hosts": network.num_addresses - 2
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
