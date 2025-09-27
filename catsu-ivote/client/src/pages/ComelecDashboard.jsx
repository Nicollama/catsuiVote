import { useEffect, useState } from "react";
import api from "../api";
import LogoutButton from "../components/LogoutButton"; // ⬅️ import logout button
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function ComelecDashboard() {
  const [turnout, setTurnout] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [turnoutRes, resultsRes] = await Promise.all([
          api.get("/comelec/turnout"),
          api.get("/comelec/results"),
        ]);
        setTurnout(turnoutRes.data);
        setResults(resultsRes.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading dashboard...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  // Data for turnout pie chart
  const turnoutData = turnout
    ? [
        { name: "Voted", value: turnout.voted },
        { name: "Not Voted", value: turnout.total - turnout.voted },
      ]
    : [];

  return (
    <div className="p-6">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Comelec Dashboard</h1>
        <LogoutButton />
      </div>

      {/* Voter Turnout */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Voter Turnout</h2>
        <div className="flex flex-col md:flex-row gap-10 items-center">
          <p className="text-gray-700">
            {turnout.voted} out of {turnout.total} students have voted (
            {((turnout.voted / turnout.total) * 100).toFixed(1)}%)
          </p>
          <PieChart width={300} height={250}>
            <Pie
              data={turnoutData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {turnoutData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </section>

      {/* Results */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Election Results</h2>
        {results.length === 0 ? (
          <p>No votes yet</p>
        ) : (
          <div className="flex flex-col md:flex-row gap-10">
            {/* Results List */}
            <ul className="space-y-2 flex-1">
              {results.map((r) => (
                <li
                  key={r.candidateId}
                  className="bg-white p-3 rounded shadow flex justify-between"
                >
                  <span>
                    {r.candidateName} – {r.position}
                  </span>
                  <span className="font-bold">{r.votes} votes</span>
                </li>
              ))}
            </ul>

            {/* Results Chart */}
            <BarChart
              width={500}
              height={300}
              data={results}
              className="flex-1"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="candidateName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="votes" fill="#0088FE" />
            </BarChart>
          </div>
        )}
      </section>
    </div>
  );
}
