import { useCallback, useEffect, useState } from "react";
import { chooseTextColor, randomColor } from "./utils";
import './App.scss';

function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({ state: false });

  const load = useCallback(() => {
    setEntries([]);

    setTimeout(() => {
      fetch('input.json') // get data from fake api
        .then(response => {
          if (!response.ok) {
            setError({ state: true, value: "Network response was not ok" });
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          // sort data by time
          const sortedData = data.sort((a, b) => {
            const timeA = a.start.split(':');
            const timeB = b.start.split(':');
            return timeA[0] - timeB[0] || timeA[1] - timeB[1];
          });
          // store data
          setEntries(sortedData);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching JSON:', error);
          setLoading(false);
          setError({ state: true, value: "Error fetching JSON" });
        });
    }, 1000); // to see loading
  }, []);

  useEffect(() => {
    if (!loading) return;
    load();
  }, [load, loading]);

  if (error.state) {
    return <div className="App">{error.value}</div>;
  }
  if (loading) {
    return <div className="App">Loading...</div>;
  }

  const parseTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatMinutesToTime = (minutes) => {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  const calculateEndTime = (entry) => {
    const startTimeInMinutes = parseTimeToMinutes(entry.start);
    const endTimeInMinutes = startTimeInMinutes + entry.duration;
    return formatMinutesToTime(endTimeInMinutes);
  };

  const doesOverlap = (entry1, entry2) => {
    if (entry1.id === entry2.id) return false;
    const start1 = parseTimeToMinutes(entry1.start);
    const end1 = start1 + entry1.duration;
    const start2 = parseTimeToMinutes(entry2.start);
    const end2 = start2 + entry2.duration;

    return (start1 < end2 && end1 > start2);
  };

  const assignColumns = (entries) => {
    entries.forEach(entry => {
      entry.end = calculateEndTime(entry);
    });

    const columns = [];

    entries.forEach(entry => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        if (!columns[i].some(colEntry => doesOverlap(colEntry, entry))) {
          columns[i].push(entry);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([entry]);
      }
    });

    return columns;
  };

  const calculateStyles = (entries, screenHeight, startTime, endTime) => {
    const columns = assignColumns(entries);
    const styles = [];
    const processedEntries = [];

    columns.forEach((column, colIndex) => {
      column.forEach((entry, rowIndex) => {
        let overlapCount = 0;
        columns.forEach((col, i) => {
          if (i !== colIndex && col.some(colEntry => doesOverlap(colEntry, entry))) {
            overlapCount++;
          }
        });
        const [startHour, startMinute] = entry.start.split(':').map(Number);
        const startInMinutes = (startHour - startTime) * 60 + startMinute;
        const top = (startInMinutes / ((endTime - startTime) * 60)) * screenHeight;
        const height = (entry.duration / ((endTime - startTime) * 60)) * screenHeight;
        const width = overlapCount > 0 ? `${100 / (overlapCount + 1)}%` : `100%`;
        const left = overlapCount > 0 ? `${(100 / (overlapCount + 1)) * colIndex}%` : `0%`;
        const background = randomColor();
        const text = chooseTextColor(background);

        styles.push({
          id: entry.id,
          top: `${top}px`,
          height: `${height}px`,
          width: width,
          left: left,
          backgroundColor: background,
          color: text
        });

        processedEntries.push(entry);
      });
    });

    // Post-Process to expand or limit width
    styles.forEach(style => {
      const entry = entries.find(e => e.id === style.id);
      const overlappedEntries = processedEntries.filter(e => doesOverlap(e, entry) && e.id !== entry.id);
      if (overlappedEntries.length === 0) {
        style.width = '100%';
        style.left = '0%';
      } else if (
        overlappedEntries.length === 1 &&
        parseTimeToMinutes(overlappedEntries[0].start) < parseTimeToMinutes(entry.start)
      ) {
        const overlappedStyle = styles.find(s => s.id === overlappedEntries[0].id);
        const widthOverlapped = overlappedStyle.width.slice(0, overlappedStyle.width.length - 1) / 2;
        if (overlappedStyle.width.slice(0, overlappedStyle.width.length - 1) < 50)
          style.width = `${style.width.slice(0, style.width.length - 1) - widthOverlapped.toFixed(2)}%`;
      }
    });

    return styles;
  };

  const screenHeight = window.innerHeight;
  const startTime = 9;
  const endTime = 21;
  const styles = calculateStyles(entries, screenHeight, startTime, endTime);

  return (
    <div className="App">
      <div className="Calendar" style={{ height: `${screenHeight}px` }}>
        {entries.map((entry) => {
          const style = styles.find(style => style.id === entry.id);
          return (
            <div
              key={entry.id}
              className="Tile"
              style={style}
            >
              {entry.id} | {entry.start} | {entry.duration}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
