function getNodes(graph) {
    /// returns an array for further use even if u pass a graph object or simple json as input
    // can encounter json when i save to DB and then load data from DB 
    if (graph && typeof graph.getNodes === "function") {
        return graph.getNodes();
    }

    if (graph && Array.isArray(graph.nodes)) {
        return graph.nodes;
    }

    return [];
}

function getEdges(graph) {
    if (graph && typeof graph.getEdges === "function") {
        return graph.getEdges();
    }

    if (graph && Array.isArray(graph.edges)) {
        return graph.edges;
    }

    return [];
}

function getNode(graph, nodeId) {
    if (graph && typeof graph.getNode === "function") {
        return graph.getNode(nodeId);
    }

    return getNodes(graph).find((node) => node.id === nodeId) || null;
}

function normalizeId(fileId) {
    return fileId.replaceAll("\\", "/");
}

module.exports = {
    getNodes,
    getEdges,
    getNode,
    normalizeId
};
