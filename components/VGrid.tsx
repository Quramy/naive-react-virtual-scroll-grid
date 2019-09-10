import React from "react";

type Props<T> = {
  items: T[];
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

const firstRenderItemsCount = 3 * 4;

export class VGrid<T extends { name: string; } = { name: string; }> extends React.Component<Props<T>, State> {

  containerRef = React.createRef<HTMLDivElement>();
  firstRenderUlRef = React.createRef<HTMLUListElement>();
  previousMarkerOffsetTop?: number;

  state: State = {
    isIntersecting: false,
    offset: firstRenderItemsCount,
    cellCountPerColumn: 1,
    containerHeight: 0,
    visibleItemsCount: 20,
  };

  observer?: IntersectionObserver;

  constructor(props: Props<T>) {
    super(props);
    this.handleOnScroll = this.handleOnScroll.bind(this);
  }

  componentDidMount() {
    const containerElement = this.containerRef.current;
    if (!containerElement) return;
    this.observer = new IntersectionObserver(entries => {
      if (entries.length !== 1) return;
      const entry = entries[0];
      const { isIntersecting } = entry;
      this.setState({ isIntersecting });
    }, {
      threshold: 0,
    });
    this.observer.observe(containerElement);
    document.addEventListener("scroll", this.handleOnScroll);

    this.updateContainerState();

    const rafCb = () => {
      this.watchGridMarkerPosition();
      requestAnimationFrame(rafCb);
    };
    rafCb();
  }

  componentWillUnmount() {
    document.removeEventListener("scroll", this.handleOnScroll);
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private watchGridMarkerPosition() {
    const fixUlElement = this.firstRenderUlRef.current;
    if (!fixUlElement) return;
    const markerElement = fixUlElement.lastElementChild as HTMLElement;
    const currentMarkerOffsetTop = markerElement.offsetTop;
    if (this.previousMarkerOffsetTop !== currentMarkerOffsetTop) {
      this.previousMarkerOffsetTop = currentMarkerOffsetTop;
      Promise.resolve().then(() => this.updateContainerState());
    }
  }

  private updateContainerState() {
    const { rowGap, cellHeight } = this.props;
    const rowHeight = cellHeight + rowGap;
    const allItemsCount = this.props.items.length;
    const cellCountPerColumn = this.countCellsInColumn();
    const containerHeight = Math.ceil(allItemsCount / cellCountPerColumn) * rowHeight - rowGap;

    this.setState({ containerHeight, cellCountPerColumn });

    requestAnimationFrame(() => this.updateCurrentOffset());
  }

  private countCellsInColumn() {
    const fixUlElement = this.firstRenderUlRef.current;
    if (!fixUlElement) return 1;
    this.previousMarkerOffsetTop = (fixUlElement.lastElementChild as HTMLLIElement).offsetTop;
    const listItems = fixUlElement.querySelectorAll("li[data-item-number]") as NodeListOf<HTMLLIElement>;
    let lastOffestTop: number = 0;
    let count = 0;
    for (let listItem of listItems) {
      if (listItem.offsetTop !== lastOffestTop) {
        break;
      }
      ++count;
      lastOffestTop = listItem.offsetTop;
    }
    // console.log(count);
    return count;
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
    if (nextOffset >= firstRenderItemsCount && this.state.offset !== nextOffset) {
      this.setState({ offset: nextOffset });
    }
  }

  private createFirstItems() {
    return this.props.items.slice(0, firstRenderItemsCount);
  }

  private createVisibleItems() {
    const { offset, visibleItemsCount } = this.state;
    return this.props.items.slice(offset, visibleItemsCount + offset);
  }

  private calculateVScrollGridTop() {
    const { rowGap, cellHeight } = this.props;
    const rowHeight = cellHeight + rowGap;
    const { offset, cellCountPerColumn } = this.state;
    return ~~(offset  / cellCountPerColumn) * rowHeight;
  }

  render() {
    const { items, renderItem } = this.props;
    const { containerHeight } = this.state;
    const top = this.calculateVScrollGridTop();
    return (
      <div ref={this.containerRef} style={{ height: containerHeight, position: "relative" }}>
        <ul style={{ position: "absolute", left: 0, right: 0, top: 0 }} ref={this.firstRenderUlRef} className="cellGrid">
          {this.createFirstItems().map((item, i) => {
            return (
              <li data-item-number={i} key={item.name}>
                {renderItem({ item })}
              </li>
            );
          })}
        </ul>
        <ul style={{ position: "absolute", left: 0, right: 0, top }} className="cellGrid">
          {this.createVisibleItems().map(item => {
            return (
              <li key={item.name}>
                {renderItem({ item })}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
