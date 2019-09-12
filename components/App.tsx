import React, { useState } from 'react';
import { VGrid } from './VGrid';
import { InitialHashProvider } from './InitialHashContext';

function range(n: number = 0) {
  const arr: number[] = [];
  for (let i = 0; i < n; ++i) {
    arr.push(i);
  }
  return arr;
}

const data = {
  failed: range(3).map(i => ({
    num: i,
    name: `failed_${i}`,
  })),
  newItems: range(20).map(i => ({
    num: i,
    name: `new_${i}`,
  })),
  passed: range(1000).map(i => ({
    num: i,
    name: `passed_${i}`,
  })),
};

const ListItem = ({ item }: { item: { name: string; }}) => {
  const [clicked, updateClicked] = useState(false);
  return (
    <div className='boxCell' onClick={() => updateClicked(true)}>
      <div>
        {item.name}
      </div>
      {clicked ? (
        <div>clicked</div>
      ): null}
    </div>
  );
};

const gridOption = [
  {
    media: 'all',
    gridGap: 16,
  },
  {
    media: 'screen and (min-width: 500px)',
    gridGap: 32,
    minContentLength: 360,
  },
  {
    media: 'screen and (min-width: 960px)',
    gridGap: 32,
    minContentLength: 420,
  },
];

export const App = () => {
  return (
    <InitialHashProvider>
      <h1>Report detail</h1>

      <nav>
        {data.passed.slice(0, 100).map(item => (
          <a key={item.name} href={`#${item.name}`}>{item.name} </a>
        ))}
      </nav>

      <h2>Changed</h2>
      <VGrid
        items={data.failed}
        itemKey="name"
        cellHeight={160}
        gridOptions={gridOption}
      >
        {({ item }) => <ListItem item={item} />}
      </VGrid>

      <h2>New</h2>
      <VGrid
        items={data.newItems}
        itemKey="name"
        cellHeight={160}
        gridOptions={gridOption}
      >
        {({ item }) => <ListItem item={item} />}
      </VGrid>

      <h2>Passed</h2>
      <VGrid
        items={data.passed}
        itemKey="name"
        cellHeight={160}
        gridOptions={gridOption}
      >
        {({ item }) => <ListItem item={item} />}
      </VGrid>
    </InitialHashProvider>
  )
};
