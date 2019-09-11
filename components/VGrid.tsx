import React from 'react';
import { animateScroll } from 'react-scroll';
import { ResizeObserver } from '@juggle/resize-observer'

type Props<T> = {
  items: T[];
  keyFn: (item: T) => string;
  renderItem: (props: { item: T }) => any;
  rowGap: number;
  cellHeight: number;
};

type State = {
  isIntersecting: boolean;
  offset: number;
  containerHeight: number;
  cellCountPerColumn: number;
  visibleItemsCount: number;
};

let hashConsumed = false;

export class VGrid<T> extends React.Component<Props<T>, State> {

  containerRef = React.createRef<HTMLDivElement>();
  firstRenderUlRef = React.createRef<HTMLUListElement>();

  state: State = {
    isIntersecting: false,
    offset: 0,
    cellCountPerColumn: 1,
    containerHeight: 0,
    visibleItemsCount: 20,
  };

  intersectionObserver?: IntersectionObserver;
  resizeObserver?: ResizeObserver;
  previousContainerWidth?: number;

  constructor(props: Props<T>) {
    super(props);
    this.handleOnScroll = this.handleOnScroll.bind(this);
    this.handleOnHashChange = this.handleOnHashChange.bind(this);
  }

  componentDidMount() {
    const containerElement = this.containerRef.current;
    if (!containerElement) return;
    this.intersectionObserver = new IntersectionObserver(entries => {
      if (entries.length !== 1) return;
      const entry = entries[0];
      const { isIntersecting } = entry;
      this.setState({ isIntersecting });
    }, {
      threshold: 0,
    });
    this.intersectionObserver.observe(containerElement);
    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length !== 1) return;
      const entry = entries[0];
      const { contentRect: { width } } = entry;
      if (this.previousContainerWidth !== width) {
        this.updateContainerState(width);
      }
      this.previousContainerWidth = width;
    });
    this.resizeObserver.observe(containerElement);
    document.addEventListener('scroll', this.handleOnScroll);
    window.addEventListener('hashchange', this.handleOnHashChange);

    this.previousContainerWidth = containerElement.clientWidth;
    this.updateContainerState(containerElement.clientWidth);
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleOnScroll);
    window.removeEventListener('hashchange', this.handleOnHashChange);
    this.intersectionObserver && this.intersectionObserver.disconnect();
    this.resizeObserver && this.resizeObserver.disconnect();
  }

  private updateContainerState(containerWidth: number) {
    const { rowGap, cellHeight } = this.props;
    const rowHeight = cellHeight + rowGap;
    const allItemsCount = this.props.items.length;
    const cellCountPerColumn = this.countCellsInColumn(containerWidth);
    const containerHeight = Math.ceil(allItemsCount / cellCountPerColumn) * rowHeight - rowGap;

    this.setState({ containerHeight, cellCountPerColumn });

    if (!hashConsumed) {
      const hit = this.calculatePositionFromHash(location.hash);
      if (hit) {
        hashConsumed = true;
        console.log(hit);
        this.setState({ offset: hit.offset });
        setTimeout(() => {
          scrollTo(0, this.calculateScrollTop(hit.offset));
        }, 10);
        return;
      }
    }

    requestAnimationFrame(() => this.updateCurrentOffset());
  }

  private countCellsInColumn(containerWidth: number) {
    const { rowGap } = this.props;
    // TODO
    if (containerWidth >= 760) return ~~((containerWidth + rowGap) / (360 + rowGap));
    return 1;
  }

  private calculatePositionFromHash(hash: string) {
    const { keyFn } = this.props;
    const targetName = hash.slice(1);
    const foundIndex = this.props.items.findIndex(item => keyFn(item) === targetName);
    if (foundIndex === -1) return;
    return {
      offset: foundIndex,
    };
  }

  private handleOnHashChange({ newURL }: HashChangeEvent) {
    const { hash } = new URL(newURL)
    const hit = this.calculatePositionFromHash(hash);
    if (!hit) return;
    animateScroll.scrollTo(this.calculateScrollTop(hit.offset));
  }

  private handleOnScroll() {
    if (!this.state.isIntersecting) return;
    this.updateCurrentOffset();
  };

  private updateCurrentOffset() {
    const { rowGap, cellHeight } = this.props;
    const rowHeight = cellHeight + rowGap;
    const containerElement = this.containerRef.current;
    if (!containerElement) return;
    const cot = containerElement.offsetTop;
    const wsy = window.scrollY;
    const deltaY = wsy - cot;
    const nextOffset = ~~(deltaY / rowHeight) * this.state.cellCountPerColumn;
    if (nextOffset >= 0 && this.state.offset !== nextOffset) {
      this.setState({ offset: nextOffset });
    }
  }

  private createVisibleItems() {
    const { offset, visibleItemsCount } = this.state;
    return this.props.items.slice(offset, visibleItemsCount + offset);
  }

  private calculateVScrollGridTop(offsetIndex: number) {
    const { rowGap, cellHeight } = this.props;
    const rowHeight = cellHeight + rowGap;
    const { cellCountPerColumn } = this.state;
    return ~~(offsetIndex  / cellCountPerColumn) * rowHeight;
  }

  private calculateScrollTop(offsetIndex: number) {
    if (!this.containerRef.current) return 0;
    return this.calculateVScrollGridTop(offsetIndex) + this.containerRef.current.offsetTop;
  }

  render() {
    const { renderItem, keyFn } = this.props;
    const { containerHeight } = this.state;
    const top = this.calculateVScrollGridTop(this.state.offset);
    return (
      <div ref={this.containerRef} style={{ height: containerHeight, position: 'relative' }}>
        <ul style={{ position: 'absolute', left: 0, right: 0, top }} className='cellGrid'>
          {this.createVisibleItems().map(item => {
            return (
              <li key={keyFn(item)}>
                {renderItem({ item })}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
