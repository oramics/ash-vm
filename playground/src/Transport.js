import React from "react";
import "./Transport.css";

const stopAll = vm => e => {
  e.preventDefault();
  vm.run(["@stop-all"], false);
};

const Transport = ({ vm, bpm, setTempo }) => (
  <div className="Transport">
    <div className="center">
      <div>
        <a href="#!" onClick={stopAll(vm)}>Stop all</a>
      </div>
      <div>
        <span>Tempo (bpm):</span>
        <input
          type="number"
          value={bpm}
          onChange={e => setTempo(e.target.value)}
        />
      </div>
    </div>
    <div>&nbsp;</div>
  </div>
);
export default Transport;
