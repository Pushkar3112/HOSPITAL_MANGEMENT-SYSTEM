import React from "react";

export const Loading = ({ message = "Loading..." }) => {
  return (
    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
      <div style={{ fontSize: "14px", marginTop: "10px" }}>{message}</div>
    </div>
  );
};

export const SkeletonLoader = ({ count = 1, height = 200 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: `${height}px`,
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        />
      ))}
    </>
  );
};

export default Loading;
