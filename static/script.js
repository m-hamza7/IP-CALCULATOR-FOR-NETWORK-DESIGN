document.addEventListener("DOMContentLoaded", function () {
    // Register Organization
    document.getElementById("register-org").addEventListener("click", function () {
        let orgName = document.getElementById("org-name").value.trim();
        let pcCount = parseInt(document.getElementById("pc-count").value.trim());

        if (!orgName || isNaN(pcCount) || pcCount <= 0) {
            alert("Please enter a valid organization name and PC count.");
            return;
        }

        fetch("/register_org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ org_name: orgName, pc_count: pcCount })
        })
        .then(response => response.json())
        .then(data => alert(data.message || data.error))
        .catch(error => console.error("Error:", error));
    });

    // Calculate Subnets
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
            body: JSON.stringify({
                org_name: orgName,
                ip_address: ipAddress,
                subnet_mask: subnetMask
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                document.getElementById("result").innerHTML = `
                    <p><strong>Network Address:</strong> ${data.network_address}</p>
                    <p><strong>First Usable IP:</strong> ${data.network_address+1}</p>
                    <p><strong>Last Usable IP:</strong> ${data.broadcast_address-1}</p>
                    <p><strong>Broadcast Address:</strong> ${data.broadcast_address}</p>
                    <p><strong>Total Hosts:</strong> ${data.total_hosts}</p>
                    <p><strong>Assigned Subnet:</strong> ${data.assigned_subnet}</p>
                `;
            }
        })
        .catch(error => console.error("Error:", error));
    });

    // Export Subnet Data
    document.getElementById("export-btn").addEventListener("click", function () {
        fetch("/export_subnets")
        .then(response => response.json())
        .then(data => {
            const exportData = JSON.stringify(data, null, 2);
            const blob = new Blob([exportData], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "subnet_data.json";
            link.click();
        })
        .catch(error => console.error("Error exporting subnets:", error));
    });

    // Load Subnet Chart
    document.getElementById("load-chart").addEventListener("click", function () {
        fetch("/export_subnets")
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                throw new Error("No subnet data available");
            }

            const orgSubnetCounts = {};
            data.forEach(item => {
                if (item && item.organization) {
                    orgSubnetCounts[item.organization] = item.subnet_count || 0;
                }
            });

            const labels = Object.keys(orgSubnetCounts);
            const values = Object.values(orgSubnetCounts);

            const ctx = document.getElementById("subnetChart");
            if (!ctx) {
                throw new Error("Canvas element not found");
            }

            // Destroy existing chart if it exists and is a valid Chart instance
            if (window.subnetChart && typeof window.subnetChart.destroy === 'function') {
                window.subnetChart.destroy();
            }

            // Create new chart
            window.subnetChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Number of Subnets",
                        data: values,
                        backgroundColor: "rgba(54, 162, 235, 0.5)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error("Error loading chart:", error);
            alert("Error loading chart data: " + error.message);
        });
    });
});

// In your load chart function, before fetching:
document.getElementById("loading").style.display = "block";

// After chart is loaded or if there's an error:
document.getElementById("loading").style.display = "none";
