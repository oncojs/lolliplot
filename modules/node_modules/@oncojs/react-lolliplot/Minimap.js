import React from 'react'
import MinimapNode from './MinimapNode'
import ZoomArea from './MinimapZoomAreaNode'

let Minimap = ({
  height = 50,
  ...props
}) => (
  <div style={{ position: `relative`, height: `${height}px` }}>
    <div style={{ position: `absolute` }}>
      <MinimapNode
        height={height}
        {...props}
      />
    </div>
    <div style={{ position: `absolute` }}>
      <ZoomArea
        height={height}
        {...props}
      />
    </div>
  </div>
)

export default Minimap
