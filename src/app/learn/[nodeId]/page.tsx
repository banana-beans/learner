import { notFound } from "next/navigation";
import curriculum from "@/data/curriculum";
import { pythonTier1Challenges } from "@/data/challenges/python-tier1";
import { LearnPageClient } from "./LearnPageClient";

// Next.js 16: params is a Promise — must be awaited
export default async function LearnPage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;

  // Decode URL-encoded colons (python%3At1%3Ahello-world → python:t1:hello-world)
  const decodedNodeId = decodeURIComponent(nodeId);

  const node = curriculum.nodeMap[decodedNodeId];
  if (!node) notFound();

  // Find challenges for this node
  const challenges = pythonTier1Challenges.filter(
    (c) => c.nodeId === decodedNodeId
  );

  return (
    <LearnPageClient node={node} challenges={challenges} />
  );
}
