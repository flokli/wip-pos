import { addHours, endOfHour, isAfter, isBefore } from "date-fns";
import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Camps from "../api/camps";
import Sales from "../api/sales";
import useMongoFetch from "../hooks/useMongoFetch";

export default function CampByCamp() {
  const { data: camps, loading: campsLoading } = useMongoFetch(Camps, []);
  const { data: sales, loading: salesLoading } = useMongoFetch(Sales, []);
  const longestCamp = camps.reduce((memo, camp) => {
    if (!memo) {
      memo = camp;
    } else {
      if (camp.end - camp.start > memo.end - memo.start) memo = camp;
    }
    return memo;
  }, null);
  const longestCampHours = longestCamp
    ? Math.ceil((longestCamp.end - longestCamp.start) / (3600 * 1000))
    : null;

  let data = [];
  if (longestCampHours && sales.length) {
    let campTotals = {};
    for (let i = 0; i < longestCampHours; i++) {
      const datapoint = { hour: i };
      camps.forEach((camp) => {
        const count = sales
          .filter(
            (sale) =>
              isAfter(sale.timestamp, addHours(camp.start, i)) &&
              isBefore(sale.timestamp, endOfHour(addHours(camp.start, i))),
          )
          .reduce((memo, sale) => memo + sale.amount, 0);
        if (count) {
          campTotals[camp.slug] = (campTotals[camp.slug] || 0) + count;
          datapoint[camp.slug] = campTotals[camp.slug];
        }
      });
      data.push(datapoint);
    }
    console.log(data);
  }
  if (campsLoading || salesLoading) return "Loading...";
  return (
    <ResponsiveContainer width={900} height={400}>
      <LineChart data={data} margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          interval={5}
          tickFormatter={(hour) =>
            String(((hour + 1 + 2) % 24) - 1).padStart(2, "0")
          }
        />
        <YAxis
          domain={["dataMin", "dataMax"]}
          label={{
            value: "Revenue (HAX)",
            angle: -90,
            offset: 70,
            position: "insideLeft",
            style: { fill: "yellow" },
          }}
        />
        <Tooltip
          labelFormatter={(hour) =>
            `H${String(((hour + 1 + 2) % 24) - 1).padStart(2, "0")}D${String(
              Math.ceil(hour / 24),
            ).padStart(2, "0")}`
          }
          wrapperStyle={{ background: "black" }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="bornhack-2019"
          stroke="#FFED00"
          strokeWidth={4}
          strokeDasharray="3 3"
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="bornhack-2020"
          stroke="#FD8B25"
          strokeWidth={4}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}