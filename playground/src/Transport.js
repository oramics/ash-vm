import React from 'react';

const stopAll = (vm) => (e) => {
  e.preventDefault()
  vm.run(["@stop-all"], false)
}

const Transport = ({ vm }) => (
  <div className="Transport">
    <div>
      <a href="#!" onClick={stopAll(vm)} >Stop</a>
    </div>
    <div>
      <span>Tempo:</span>
    </div>
  </div>
)
export default Transport