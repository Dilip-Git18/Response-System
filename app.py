from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify
import sqlite3
import heapq

app = Flask(__name__)

# Database connection
def get_db_connection():
    conn = sqlite3.connect('database/ambulance.db')
    conn.row_factory = sqlite3.Row
    return conn

# Dijkstra's Algorithm
def dijkstra(start, end):
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
            path.reverse()
            return distances[end], path

        for neighbor, weight in graph.get(current_node, []):
            distance = current_distance + weight
            if neighbor not in distances or distance < distances[neighbor]:
                distances[neighbor] = distance
                previous_nodes[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))

    return float("inf"), []

# Fetch graph data for vis-network
def fetch_graph_data():
    conn = sqlite3.connect('database/ambulance.db')
    cursor = conn.cursor()
    cursor.execute("SELECT start_node, end_node, distance FROM distances")
    rows = cursor.fetchall()
    conn.close()

    nodes = set()
    edges = []

    for start, end, distance in rows:
        nodes.add(start)
        nodes.add(end)
        edges.append({'from': start, 'to': end, 'label': str(distance)})

    node_list = [{'id': node, 'label': node} for node in nodes]
    return node_list, edges


@app.route('/')
def home():
    return render_template('home.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/services')
def services():
    return render_template('services.html')

@app.route('/members')
def doctors():
    return render_template('members.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/gallary')
def gallary():
    return render_template('gallary.html',block_range=range(20))


# Routes
@app.route('/')
def index():
    nodes, edges = fetch_graph_data()
    return render_template('services.html', nodes=nodes, edges=edges)

@app.route('/dijkstra')
def dijkstra_page():
    return render_template('dijkstra.html')

@app.route('/live_map')
def leaflet_map():
    return render_template('live_map.html')


@app.route('/vis')
def vis_graph():
    nodes, edges = fetch_graph_data()  # Fetch the data from database
    return render_template('vis.html', nodes=nodes, edges=edges)


@app.route('/get_distance', methods=['POST'])
def get_distance():
    source = request.form['source']
    destination = request.form['destination']
    distance, path = dijkstra(source, destination)

    if distance == float("inf"):
        return redirect(url_for('result_page', message=f"No path found between {source} and {destination}.", path="None"))

    return redirect(url_for('result_page', message=f"The shortest distance between {source} and {destination} is {distance} units.", path=" → ".join(path)))

@app.route('/result')
def result_page():
    message = request.args.get('message')
    path = request.args.get('path')
    return render_template('result.html', message=message, path=path)

@app.route('/node_info/<node>')
def node_info(node):
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
    

    

if __name__ == '__main__':
    app.run(debug=True)