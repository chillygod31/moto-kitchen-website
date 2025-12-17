"use client";

// Temporarily disabled until Sanity is fully configured
// import { NextStudio } from "next-sanity/studio";
// import config from "../../../sanity.config";

export default function StudioPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Sanity Studio</h1>
        <p className="text-gray-600">Sanity CMS is not yet configured. Please set up your Sanity project first.</p>
      </div>
    </div>
  );
  // return <NextStudio config={config} />;
}

