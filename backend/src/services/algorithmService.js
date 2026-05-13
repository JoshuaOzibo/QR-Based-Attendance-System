import { findShortestPath } from '../algorithms/dijkstra.js';
import { getProfileRecommendations } from '../algorithms/profileOptimizer.js';
import { exploreCommunity } from '../algorithms/graphTraversal.js';
import { StudentRepository } from '../repositories/studentRepository.js';

export class AlgorithmService {
    static getShortestPath(start, end) {
        if (!start || !end) throw new Error("Start and end locations are required.");

        const graphData = {
            nodes: ["HostelA", "HostelB", "Library", "Mess", "AdminBuilding", "CSEDept", "ECEdept", "MainGate"],
            edges: [
                { from: "HostelA", to: "Mess", weight: 5 },
                { from: "HostelA", to: "Library", weight: 7 },
                { from: "Mess", to: "CSEDept", weight: 10 },
                { from: "Library", to: "CSEDept", weight: 6 },
                { from: "Library", to: "AdminBuilding", weight: 3 },
                { from: "AdminBuilding", to: "ECEdept", weight: 4 },
                { from: "CSEDept", to: "ECEdept", weight: 2 },
                { from: "MainGate", to: "HostelA", weight: 15 },
                { from: "MainGate", to: "AdminBuilding", weight: 8 },
            ]
        };
        
        if (!graphData.nodes.includes(start) || !graphData.nodes.includes(end)) {
             throw new Error("One or both locations not found in map data.");
        }

        const result = findShortestPath(start, end, graphData);
        if (!result || result.path.length === 0) {
            return { message: `No path found from ${start} to ${end}.`, data: result };
        }

        return { data: result };
    }

    static async getRecommendations(rollNo, type) {
        if (!type) throw new Error("Recommendation type is required (e.g., 'course', 'job').");

        const studentProfile = await StudentRepository.findProfileByRollNo(rollNo);
        if (!studentProfile) throw new Error("Student profile not found.");

        let availableItems = [];
        if (type === "course") {
            availableItems = [
                { name: "Intro to Programming", value: 10, weight: 2 },
                { name: "Machine Learning", value: 30, weight: 4 },
                { name: "Data Structures", value: 20, weight: 3 },
                { name: "Basic Electronics", value: 15, weight: 3 },
            ];
        } else if (type === "job") {
            availableItems = [
                { name: "Software Dev Intern", value: 50, weight: 5 },
                { name: "Data Analyst", value: 40, weight: 4 },
                { name: "Hardware Engineer", value: 35, weight: 4 },
            ];
        } else {
            throw new Error("Unsupported recommendation type.");
        }
        
        // Assume capacity is 10 for demonstration
        return getProfileRecommendations(availableItems, 10);
    }

    static async exploreStudentCommunity(rollNo, depthStr, algorithm) {
        const depth = parseInt(depthStr) || 2;
        if (algorithm !== 'bfs' && algorithm !== 'dfs') throw new Error("Invalid algorithm type. Use 'bfs' or 'dfs'.");
        if (depth <= 0 || depth > 5) throw new Error("Depth must be between 1 and 5.");

        const studentExists = await StudentRepository.findProfileByRollNo(rollNo);
        if (!studentExists) throw new Error("Starting student profile not found.");

        const allStudents = await StudentRepository.findAllStudents();
        const mockConnections = [
            { from: allStudents[0]?.universityRollNo, to: allStudents[1]?.universityRollNo, type: "classmate" },
            { from: allStudents[0]?.universityRollNo, to: allStudents[2]?.universityRollNo, type: "project_partner" },
            { from: allStudents[1]?.universityRollNo, to: allStudents[3]?.universityRollNo, type: "classmate" },
        ].filter(c => c.from && c.to);

        // Convert graph to adjacency list for the algorithm
        const graph = {};
        allStudents.forEach(s => graph[s.universityRollNo] = []);
        mockConnections.forEach(c => {
            if (graph[c.from] && graph[c.to]) {
                graph[c.from].push(c.to);
                graph[c.to].push(c.from); // undirected
            }
        });
        
        return exploreCommunity(rollNo, graph, depth, algorithm);
    }
}
