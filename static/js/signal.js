// Parse graph data from the HTML
const graphRaw = document.getElementById('graph-data').textContent;
const graphData = JSON.parse(graphRaw);

const nodes = new vis.DataSet(graphData.nodes);
const edges = new vis.DataSet(
    graphData.edges.map(edge => ({
        ...edge,
        id: `${edge.from}-${edge.to}`,
        arrows: '',
        color: { color: '#999' }
    }))
);

const container = document.getElementById('network');
const data = { nodes, edges };
const options = {
    edges: {
        font: { align: 'top' }
    },
    nodes: {
        shape: 'dot',
        size: 15,
        font: { size: 14 }
    },
    physics: {
        stabilization: true
    }
};

const network = new vis.Network(container, data, options);

// On node click
network.on("click", function (params) {
    const infoBox = document.getElementById("info-box");

    edges.forEach(edge => {
        edges.update({ id: edge.id, arrows: '', color: { color: '#999' } });
    });

    if (params.nodes.length > 0) {
        const targetNode = params.nodes[0];

        // 🔴 Record node click
        fetch(`/record_click/${targetNode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Click recorded:', data);
        })
        .catch(error => {
            console.error('Error recording click:', error);
        });

        edges.forEach(edge => {
            if (edge.to === targetNode) {
                edges.update({
                    id: edge.id,
                    arrows: 'to',
                    color: { color: '#e74c3c' }
                });
            }
        });

        fetch(`/node_info/${targetNode}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    infoBox.style.display = "none";
                } else {
                    infoBox.style.display = "block";
                    document.getElementById("info-node").textContent = targetNode;
                    document.getElementById("info-phone").textContent = data.phone || "Not available";
                    document.getElementById("info-capacity").textContent = data.capacity || "Not available";
                    document.getElementById("info-specialties").innerText = data.specialties || "Not available";
                    document.getElementById("info-website").href = data.website || "#";
                    document.getElementById("info-website").textContent = data.website ? "Visit" : "N/A";

                    const statusElement = document.getElementById("info-status");
                    if (data.status === "Available") {
                        statusElement.textContent = "Available";
                        statusElement.style.color = "green";
                    } else {
                        statusElement.textContent = "Full";
                        statusElement.style.color = "red";
                    }
                }
            });
    } else {
        infoBox.style.display = "none";
    }
});

function sendActionSignal() {
    const targetNode = document.getElementById("info-node").textContent;
    fetch(`/record_action/${targetNode}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Signal sent successfully for ' + targetNode);
            } else {
                alert('Error: ' + data.error);
            }
        });
}
