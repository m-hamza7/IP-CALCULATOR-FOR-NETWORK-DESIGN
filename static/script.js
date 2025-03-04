document.addEventListener("DOMContentLoaded", function () {
    console.log("JavaScript Loaded!");

    // Ensure elements exist before accessing them
    const ipAddressInput = document.getElementById("ip-address");
    const subnetMaskInput = document.getElementById("subnet-mask");
    const calculateBtn = document.getElementById("calculate-btn");

    if (!ipAddressInput || !subnetMaskInput || !calculateBtn) {
        console.error("One or more input fields are missing in the HTML!");
        return;
    }

    calculateBtn.addEventListener("click", function () {
        console.log("Button Clicked!");

        const ipAddress = ipAddressInput.value;
        const subnetMask = subnetMaskInput.value;

        if (!ipAddress || !subnetMask) {
            console.error("IP Address or Subnet Mask is empty!");
            return;
        }

        calculateSubnet(ipAddress, subnetMask);
    });
});

function calculateSubnet(ipAddress, subnetMask) {
    fetch("/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip_address: ipAddress, subnet_mask: subnetMask })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Received Response:", data);

        if (data.error) {
            document.getElementById("result").innerHTML = `<p style="color:red;">${data.error}</p>`;
        } else {
            document.getElementById("result").innerHTML = `
                <p><strong>Network Address:</strong> ${data.network_address}</p>
                <p><strong>First Usable IP:</strong> ${data.first_usable_ip}</p>
                <p><strong>Last Usable IP:</strong> ${data.last_usable_ip}</p>
                <p><strong>Broadcast Address:</strong> ${data.broadcast_address}</p>
                <p><strong>Total Hosts:</strong> ${data.total_hosts}</p>
            `;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("result").innerHTML = `<p style="color:red;">Failed to calculate subnet. Please try again.</p>`;
    });
}
