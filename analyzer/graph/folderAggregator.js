const path = require("path");

function getDir(id) {
    if (!id) return ".";
    const parts = id.split("/");
    parts.pop();
    return parts.length === 0 ? "." : parts.join("/");
}

function aggregateFolderGraph(graphJson) {
    const nodes = graphJson.nodes || [];
    const edges = graphJson.edges || [];

    // Step 1: Group files by parent directory
    const folderMap = {};
    for (const node of nodes) {
        const dir = getDir(node.id);
        if (!folderMap[dir]) {
            folderMap[dir] = {
                id: dir,
                files: [],
                fileCount: 0,
                totalLines: 0,
                internalLinks: 0,
                externalOutgoing: 0,
                externalIncoming: 0
            };
        }
        folderMap[dir].files.push(node.id);
        folderMap[dir].fileCount += 1;
        folderMap[dir].totalLines += node.lineCount || 0;
    }

    // Step 2-5: Scan file-to-file edges, resolve to folders, build folder edges
    const folderEdgeMap = {};

    for (const edge of edges) {
        const fromDir = getDir(edge.from);
        const toDir = getDir(edge.to);

        if (fromDir === toDir) {
            // Internal link
            if (folderMap[fromDir]) {
                folderMap[fromDir].internalLinks += 1;
            }
        } else {
            // External link: folder-to-folder dependency
            if (folderMap[fromDir]) folderMap[fromDir].externalOutgoing += 1;
            if (folderMap[toDir]) folderMap[toDir].externalIncoming += 1;

            const edgeKey = `${fromDir}->${toDir}`;
            if (!folderEdgeMap[edgeKey]) {
                folderEdgeMap[edgeKey] = {
                    from: fromDir,
                    to: toDir,
                    weight: 0,
                    files: []
                };
            }
            folderEdgeMap[edgeKey].weight += 1;
            folderEdgeMap[edgeKey].files.push({ from: edge.from, to: edge.to });
        }
    }

    // Step 6-7: Compile and return
    const folderNodes = Object.values(folderMap).map(f => ({
        id: f.id,
        fileCount: f.fileCount,
        totalLines: f.totalLines,
        internalLinks: f.internalLinks,
        externalOutgoing: f.externalOutgoing,
        externalIncoming: f.externalIncoming
    }));

    const folderEdges = Object.values(folderEdgeMap);

    return {
        nodes: folderNodes,
        edges: folderEdges
    };
}

module.exports = { aggregateFolderGraph };
