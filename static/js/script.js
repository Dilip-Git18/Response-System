// Parse graph data from the HTML
const graphRaw = document.getElementById('graph-data').textContent;
const graphData = JSON.parse(graphRaw);

const nodes = new vis.DataSet(graphData.nodes);
const edges = new vis.DataSet(
    graphData.edges.map(edge => ({
        ...edge,
        id: `${edge.from}-${edge.to}`,
        arrows: '',  // default: no arrow
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

    // Reset all edges to no arrows
    edges.forEach(edge => {
        edges.update({ id: edge.id, arrows: '', color: { color: '#999' } });
    });

    if (params.nodes.length > 0) {
        const targetNode = params.nodes[0];

        // Show arrows pointing to the clicked node
        edges.forEach(edge => {
            if (edge.to === targetNode) {
                edges.update({
                    id: edge.id,
                    arrows: 'to',
                    color: { color: '#e74c3c' }
                });
            }
        });

        // Fetch node info
        fetch(`/node_info/${targetNode}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    // If no data found, hide the info box
                    infoBox.style.display = "none";
                } else {
                    // If valid data is found, display the info box
                    infoBox.style.display = "block";
                    document.getElementById("info-node").textContent = targetNode;
                    document.getElementById("info-phone").textContent = data.phone || "Not available";
                    document.getElementById("info-capacity").textContent = data.capacity || "Not available";
                    document.getElementById("info-specialties").innerText = data.specialties || "Not available";
                    document.getElementById("info-website").href = data.website || "#";
                    document.getElementById("info-website").textContent = data.website ? "Visit" : "N/A";

                    // Set the status and color it
                    const statusElement = document.getElementById("info-status");
                    if (data.status === "Available") {
                        statusElement.textContent = "Status: Available";
                        statusElement.style.color = "green";
                    } else {
                        statusElement.textContent = "Status: Full";
                        statusElement.style.color = "red";
                    }
                }
            });
    } else {
        infoBox.style.display = "none";
    }
});
