import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/play", "routes/play.tsx"),
  route("/play/:sessionId", "routes/play.$sessionId.tsx"),
  route("/results/:sessionId", "routes/results.$sessionId.tsx"),
  route("/sessions", "routes/sessions.tsx"),
] satisfies RouteConfig;
