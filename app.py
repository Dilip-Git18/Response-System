from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify
import sqlite3
import heapq

app = Flask(__name__)

# ========================
# Database Connection
# ========================
def get_db_connection():
    """Connect to the ambulance.db SQLite database."""
    conn = sqlite3.connect('database/ambulance.db')
    conn.row_factory = sqlite3.Row
    return conn

# ========================
# Dijkstra's Algorithm
# ========================
def dijkstra(start, end):
    """Compute the shortest path using Dijkstra's algorithm."""
    conn = get_db_connection()
    edges = conn.execute('SELECT start_node, end_node, distance FROM distances').fetchall()
    conn.close()

    graph = {}
    for edge in edges:
        graph.setdefault(edge['start_node'], []).append((edge['end_node'], edge['distance']))
        graph.setdefault(edge['end_node'], []).append((edge['start_node'], edge['distance']))

    pq = [(0, start)]
    distances = {start: 0}
    previous_nodes = {start: None}

    while pq:
        current_distance, current_node = heapq.heappop(pq)
        if current_node == end:
            path = []
            while current_node is not None:
                path.append(current_node)
                current_node = previous_nodes[current_node]
            return distances[end], list(reversed(path))

        for neighbor, weight in graph.get(current_node, []):
            distance = current_distance + weight
            if neighbor not in distances or distance < distances[neighbor]:
                distances[neighbor] = distance
                previous_nodes[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))

    return float("inf"), []

# ========================
# Fetch Graph Data for vis-network
# ========================
def fetch_graph_data():
    """Retrieve nodes and edges from database for visualization."""
    conn = sqlite3.connect('database/ambulance.db')
    cursor = conn.cursor()
    cursor.execute("SELECT start_node, end_node, distance FROM distances")
    rows = cursor.fetchall()
    conn.close()

    nodes = set()
    edges = []

    for start, end, distance in rows:
        nodes.update([start, end])
        edges.append({'from': start, 'to': end, 'label': str(distance)})

    node_list = [{'id': node, 'label': node} for node in nodes]
    return node_list, edges

# ========================
# Page Routes
# ========================
@app.route('/')
def home():
    """Render the home page."""
    return render_template('home.html')

@app.route('/about')
def about():
    """Render the about page."""
    return render_template('about.html')

@app.route('/services')
def services():
    """Render the services page."""
    return render_template('services.html')

@app.route('/members')
def doctors():
    """Render the members (doctors) page."""
    return render_template('members.html')

@app.route('/contact')
def contact():
    """Render the contact page."""
    return render_template('contact.html')

@app.route('/gallary')
def gallary():
    """Render the gallary page with 20 blocks."""
    return render_template('gallary.html', block_range=range(20))

@app.route('/dijkstra')
def dijkstra_page():
    """Render the Dijkstra input page."""
    return render_template('dijkstra.html')

@app.route('/live_map')
def leaflet_map():
    """Render the live map page."""
    return render_template('live_map.html')

@app.route('/vis')
def vis_graph():
    """Render the full vis-network graph page."""
    nodes, edges = fetch_graph_data()
    return render_template('vis.html', nodes=nodes, edges=edges)

# ========================
# Form Processing Routes
# ========================
@app.route('/get_distance', methods=['POST'])
def get_distance():
    """Process Dijkstra form submission and redirect to result."""
    source = request.form['source']
    destination = request.form['destination']
    distance, path = dijkstra(source, destination)

    if distance == float("inf"):
        return redirect(url_for('result_page', message=f"No path found between {source} and {destination}.", path="None"))

    return redirect(url_for('result_page', message=f"The shortest distance between {source} and {destination} is {distance} units.", path=" → ".join(path)))

@app.route('/result')
def result_page():
    """Render the result of Dijkstra algorithm."""
    message = request.args.get('message')
    path = request.args.get('path')
    return render_template('result.html', message=message, path=path)

@app.route('/path_graph')
def path_graph():
    """Render a separate vis-network graph showing only the shortest path."""
    path = request.args.get('path', '')
    path = path.split(" → ") if path else []
    nodes, edges = fetch_graph_data()
    highlighted_nodes = {"source": path[0] if path else None, "destination": path[-1] if path else None}
    return render_template('path_graph.html', nodes=nodes, edges=edges, path=path, highlighted_nodes=highlighted_nodes)

# ========================
# Node Metadata API
# ========================
@app.route('/node_info/<node>')
def node_info(node):
    """Return JSON metadata for a given node."""
    conn = sqlite3.connect('database/node_metadata.db')
    cursor = conn.cursor()
    cursor.execute("SELECT phone, capacity, website, specialties, status FROM node_details WHERE node_id = ?", (node,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({
            'phone': row[0],
            'capacity': row[1],
            'website': row[2],
            'specialties': row[3],
            'status': row[4]
        })
    else:
        return jsonify({'error': 'No info found'})

# ========================
# Main App Runner
# ========================
if __name__ == '__main__':
    app.run(debug=True)
