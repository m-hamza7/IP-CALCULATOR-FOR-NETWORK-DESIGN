document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("register-org").addEventListener("click", function () {
        let orgName = document.getElementById("org-name").value.trim();
        if (!orgName) {
            alert("Please enter an organization name.");
            return;
        }
        fetch("/register_org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ org_name: orgName })
        })
        .then(response => response.json())
        .then(data => alert(data.message || data.error))
        .catch(error => console.error("Error:", error));
    });

    document.getElementById("calculate-btn").addEventListener("click", function () {
        let orgName = document.getElementById("org-name").value.trim();
        let ipAddress = document.getElementById("ip-address").value.trim();
        let subnetMask = document.getElementById("subnet-mask").value.trim();

        if (!orgName || !ipAddress || !subnetMask) {
            alert("Please enter Organization Name, IP Address, and Subnet Mask.");
            return;
        }

        fetch("/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ org_name: orgName, ip_address: ipAddress, subnet_mask: subnetMask })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                document.getElementById("result").innerHTML = `
                    <p><strong>Network Address:</strong> ${data.network_address}</p>
                    <p><strong>First Usable IP:</strong> ${data.first_usable_ip}</p>
                    <p><strong>Last Usable IP:</strong> ${data.last_usable_ip}</p>
                    <p><strong>Broadcast Address:</strong> ${data.broadcast_address}</p>
                    <p><strong>Total Hosts:</strong> ${data.total_hosts}</p>
                    <p><strong>Assigned Subnet:</strong> ${data.assigned_subnet}</p>
                `;
            }
        })
        .catch(error => console.error("Error:", error));
    });

    document.getElementById("export-btn").addEventListener("click", function () {
        fetch("/export_subnets")
        .then(response => response.json())
        .then(data => {
            let exportData = JSON.stringify(data, null, 2);
            let blob = new Blob([exportData], { type: "application/json" });
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "subnet_data.json";
            link.click();
        })
        .catch(error => console.error("Error exporting subnets:", error));
    });
});

document.getElementById("load-chart").addEventListener("click", function () {
    fetch("/export_subnets")
    .then(response => response.json())
    .then(data => {
        if (data.length === 0) {
            alert("No subnets assigned yet!");
            return;
        }

        let orgNames = {};
        data.forEach(entry => {
            if (!orgNames[entry.organization]) {
                orgNames[entry.organization] = 1;
            } else {
                orgNames[entry.organization]++;
            }
        });

        let labels = Object.keys(orgNames);
        let values = Object.values(orgNames);

        let ctx = document.getElementById("subnetChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Subnets Assigned",
                    data: values,
                    backgroundColor: "blue",
                    borderColor: "darkblue",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    })
    .catch(error => console.error("Error loading chart data:", error));
});
