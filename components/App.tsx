import React, { useState } from "react";
import { VGrid } from "./VGrid";

function range(n: number = 0) {
  const arr: number[] = [];
  for (let i = 0; i < n; ++i) {
    arr.push(i);
  }
  return arr;
}

const data = {
  failed: range(3).map(i => ({
    name: `failed_${i}`,
  })),
  newItems: range(20).map(i => ({
    name: `new_${i}`,
  })),
  passed: range(1500).map(i => ({
    name: `passed_${i}`,
  })),
};

const ListItem = ({ item }: { item: { name: string; }}) => {
  const [clicked, updateClicked] = useState(false);
  return (
    <div className="boxCell" onClick={() => updateClicked(true)}>
      <div>
        {item.name}
      </div>
      {clicked ? (
        <div>clicked</div>
      ): null}
    </div>
  );
};

export const App = () => {
  return (
    <>
      <h1>Report detail</h1>

      <h2>Changed</h2>
      <VGrid
        rowGap={40}
        cellHeight={160}
        items={data.failed}
        renderItem={({ item }) => (
          <ListItem key={item.name} item={item} />
        )}
      />

      <h2>New</h2>
      <VGrid
        rowGap={40}
        cellHeight={160}
        items={data.newItems}
        renderItem={({ item }) => (
          <ListItem key={item.name} item={item} />
        )}
      />

      <h2>Passed</h2>
      <VGrid
        rowGap={40}
        cellHeight={160}
        items={data.passed}
        renderItem={({ item }) => (
          <ListItem key={item.name} item={item} />
        )}
      />
    </>
  )
};


