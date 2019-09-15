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
  heros: range(2).map(i => ({
    num: i,
    name: `hero_${i}`,
  })),
  features: range(20).map(i => ({
    num: i,
    name: `feature_${i}`,
  })),
  products: range(600).map(i => ({
    num: i,
    name: `product_${i}`,
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
      <h1>Naive React Virtual Grid</h1>

      <nav>
        <a href="#hero_0">hero</a>
        <a href="#feature_0">feature</a>
        <a href="#product_0">product 0</a>
        <a href="#product_99">product 99</a>
      </nav>

      <VGrid
        items={data.heros}
        itemKey="name"
        cellHeight={380}
        gridOptions={gridOption}
      >
        {({ item }) => <ListItem item={item} />}
      </VGrid>

      <h2>Features</h2>
      <VGrid
        items={data.features}
        itemKey="name"
        cellHeight={240}
        gridOptions={gridOption}
      >
        {({ item }) => <ListItem item={item} />}
      </VGrid>

      <h2>All products</h2>
      <VGrid
        items={data.products}
        itemKey="name"
        cellHeight={160}
        gridOptions={gridOption}
      >
        {({ item }) => <ListItem item={item} />}
      </VGrid>
    </InitialHashProvider>
  )
};
