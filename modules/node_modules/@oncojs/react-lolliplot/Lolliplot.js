import React from 'react'
import LolliplotNode from './LolliplotNode'
import ZoomAreaNode from './ZoomAreaNode'

let withClickedState = Wrapped => (
  class extends React.Component {
    state = {
      clicked: false,
      zoomStart: null,
    }
    update = state => this.setState(state)
    render() {
      return Wrapped({
        setState: this.update,
        ...this.state,
        ...this.props,
      })
    }
  }
)

let Lolliplot = ({
  height = 250,
  setState,
  clicked,
  zoomStart,
  ...props
}) => (
  <div
    id="lolliplot-container"
    style={{ position: `relative`, height: `${height}px` }}
    onMouseUp={() => setState({ clicked: false, zoomStart: null })}
  >
    <div
      style={{ position: `absolute` }}
    >
      <LolliplotNode
        height={height}
        setClicked={z => setState({ clicked: true, zoomStart: z })}
        {...props}
      />
    </div>
    <div
      style={{
        position: `absolute`,
        pointerEvents: clicked ? `auto` : `none`,
      }}
    >
      <ZoomAreaNode
        height={height}
        clicked={clicked}
        _zoomState={zoomStart}
        {...props}
      />
    </div>
  </div>
)

export default withClickedState(Lolliplot)
