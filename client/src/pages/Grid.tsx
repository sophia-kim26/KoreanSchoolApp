import React from "react";
import { Grid } from "gridjs-react";

export default function GridTable() {
  return (
    <Grid
      data={[
        ["Hamlet", "hamlet@example.com"],
        ["Laertes", "laertes@gmail.com"]
      ]}
      columns={["Name", "Email"]}
      search={true}
      pagination={true}
      sort={true}
    />
  );
}