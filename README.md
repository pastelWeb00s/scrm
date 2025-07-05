# sCRM

sCRM is a lightweight, personal customer relationship management (CRM) system designed for individuals who want to manage their personal relationships in a simple and straightforward way. Unlike typical CRM systems that are tailored for businesses and focus on tracking finances, sales, and customer interactions, sCRM is focused solely on people management — ideal for managing personal connections, friendships, and any relationship you wish to track.

---

## Key Features

* People Relationship Management: No complicated features related to business or finance — just tools to help you manage and nurture personal relationships.
* Graph Database with Neo4j: The application leverages Neo4j, a graph database, as an experiment. While most CRM systems use SQL databases, Neo4j’s graph-based approach allows for an innovative way to map and visualize connections between individuals. The use of Neo4j is intentional — an experiment to explore the potential of graph databases for managing relationships. Graph databases excel in capturing and visualizing complex relationships, and it's a perfect fit for a personal CRM where the focus is on mapping connections between people rather than transactional data.
* Minimalistic Design: The interface is plain HTML with very little CSS. There are no flashy colors or complex styling, keeping the focus on functionality rather than appearance.
* Personal Use Focus: This project is designed exclusively for individuals, not businesses. There is no user management, no billing, and no features aimed at enterprise-level needs.

---

## Simple

The goal of sCRM is to keep things simple.
The project is intentionally minimal, offering the bare essentials for managing your personal network of contacts 
and relationships without the complexity and overhead of business-focused CRMs. 
If you're looking for an easy-to-use tool to track and maintain personal relationships, this is the project for you.

## Users

sCRM does not implement user management. Make sure to add a server or proxy in front of sCRM,
and configure user management there; otherwise you will expose your sCRM data.

---

## Using Docker Compose

To quickly set up the project with Docker, you can use Docker Compose to manage both the Neo4j database and the sCRM application in containers.

Below is an example of a `docker-compose.yml` file to run sCRM alongside Neo4j:

```yaml
version: '3.9'

services:
  neo4j:
    image: neo4j:5
    container_name: neo4j
    restart: unless-stopped
    env_file:
      - .env.neo4j
    volumes:
      - ./scrm/neo4j_data:/data
    expose:
      - 7474
      - 7687
    networks:
      - scrm_network
  
  scrm:
    build: ./scrm
    container_name: scrm
    restart: unless-stopped
    env_file:
      - .env
    expose:
      - 3000
    networks:
      - scrm_network

networks:
  scrm_network:
    driver: bridge
```

* Neo4j

    * The database data is persisted in the `neo4j_data` directory inside your project, ensuring data is not lost when the container stops.
    * The container exposes ports 7474 and 7687 for the HTTP interface and Bolt protocol, respectively, which are used to interact with the Neo4j database.
    * The `.env.neo4j` file should contain your environment variables (e.g., database password, username). Here's an example of what the `.env.neo4j` file could look like:

      ```env
      NEO4J_AUTH=neo4j/password
      ```
* sCRM:

    * The scrm service builds the sCRM application from a `Dockerfile` in the `./scrm` directory.
    * The application runs on port 3000 by default, and the container is exposed on this port.
    * The `.env` file for the application might include environment variables such as the Neo4j database connection details:

      ```env
      NEO4J_URI=neo4j://neo4j:7687
      NEO4J_USER=neo4j
      NEO4J_PASSWORD=password
      ```

### How to Run the Project with Docker Compose

1. Make sure you have Docker and Docker Compose installed on your machine. If not, you can download them from the official Docker website.

2. Clone your project and navigate to the root of your project directory, where your `docker-compose.yml` file is located.

3. Build and start the containers by running the following command:

   ```bash
   docker-compose up --build
   ```

   This command will:

    * Build the Docker image for the sCRM application (from the `./scrm` directory).
    * Start both the Neo4j database container and the sCRM application container.

4. After the containers are running, you can access the sCRM application by visiting:

   ```bash
   http://localhost:3000
   ```

   And you can access the Neo4j Browser by visiting:

   ```bash
   http://localhost:7474
   ```

   The default credentials for Neo4j (if you're using the example above) will be `neo4j/password`.

5. To stop the containers, use:

   ```bash
   docker-compose down
   ```

---

## Contributing

This project is open source, and I’d love for others to contribute. 
If you're interested in helping improve or expand the project, 
feel free to fork the repo, submit issues, or make pull requests. 
Please note that the focus will always remain on simplicity and 
being strictly for personal use — no plans to include features for business management or anything beyond managing people.