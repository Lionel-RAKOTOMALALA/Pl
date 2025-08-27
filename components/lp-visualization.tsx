"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { SolutionMethod } from '@/app/page'
import { solve3x3 } from '@/lib/utils';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false }) as any

type LPVisualizationProps = {
  constraints: {
    coefficients: number[][]
    signs: string[]
    values: number[]
  }
  objectiveFunction: number[]
  problemType: 'max' | 'min'
  solution: {
    isValid: boolean
    coordinates: number[]
    value: number
  }
  method: SolutionMethod
}

type Solution2DOr3D = {
  isValid: boolean;
  coordinates: number[];
  value: number;
  feasibleRegion?: [number, number][];
};

export function LPVisualization({ constraints, objectiveFunction, problemType, solution, method }: LPVisualizationProps) {
  const [plotData, setPlotData] = useState<any[]>([])
  const [plotLayout, setPlotLayout] = useState<any>({})

  useEffect(() => {
    if (constraints.coefficients.length === 0 || !objectiveFunction) {
      return
    }

    // --- VISUALISATION 3D POUR 3 VARIABLES ---
    if (objectiveFunction.length === 3) {
      // Générer des plans pour chaque contrainte
      const xRange = [0, 20]
      const yRange = [0, 20]
      const zRange = [0, 20]
      const nGrid = 15
      const constraintPlanes = constraints.coefficients.map((coeffs, i) => {
        const [a, b, c] = coeffs
        const d = constraints.values[i]
        // On génère une grille (x, y) et calcule z
        const x: number[][] = [];
        const y: number[][] = [];
        const z: (number | null)[][] = [];
        for (let xi = 0; xi < nGrid; xi++) {
          x[xi] = [];
          y[xi] = [];
          z[xi] = [];
          for (let yi = 0; yi < nGrid; yi++) {
            const xv = xRange[0] + (xRange[1] - xRange[0]) * xi / (nGrid - 1)
            const yv = yRange[0] + (yRange[1] - yRange[0]) * yi / (nGrid - 1)
            x[xi][yi] = xv
            y[xi][yi] = yv
            // a x + b y + c z = d => z = (d - a x - b y) / c
            if (Math.abs(c) > 1e-8) {
              z[xi][yi] = (d - a * xv - b * yv) / c
            } else {
              z[xi][yi] = null // plan vertical, on ne l'affiche pas
            }
          }
        }
        // Position du texte (au centre du plan dans la box)
        const textPos = [10, 10, (Math.abs(c) > 1e-8 ? (d - a*10 - b*10)/c : 10)];
        return [
          {
            type: 'surface',
            x: x,
            y: y,
            z: z,
            opacity: 0.4,
            showscale: false,
            name: `${a}x₁ + ${b}x₂ + ${c}x₃ = ${d}`,
            colorscale: [[0, ['#e74c3c', '#2980b9', '#8e44ad', '#f39c12', '#16a085', '#34495e'][i % 6]], [1, ['#e74c3c', '#2980b9', '#8e44ad', '#f39c12', '#16a085', '#34495e'][i % 6]]]
          },
          {
            type: 'scatter3d',
            mode: 'text',
            x: [textPos[0]],
            y: [textPos[1]],
            z: [textPos[2]],
            text: [`${a}x₁ + ${b}x₂ + ${c}x₃ = ${d}`],
            textfont: { color: ['#e74c3c', '#2980b9', '#8e44ad', '#f39c12', '#16a085', '#34495e'][i % 6], size: 14 },
            showlegend: false,
            hoverinfo: 'skip'
          }
        ];
      }).flat();
      // Calcul des sommets du polyèdre réalisable
      const n = constraints.coefficients.length;
      const vertices: number[][] = [];
      for (let i = 0; i < n; i++) {
        for (let j = i+1; j < n; j++) {
          for (let k = j+1; k < n; k++) {
            const A = [constraints.coefficients[i], constraints.coefficients[j], constraints.coefficients[k]];
            const b = [constraints.values[i], constraints.values[j], constraints.values[k]];
            const pt = solve3x3(A, b);
            if (!pt) continue;
            // Vérifier que le point satisfait toutes les contraintes (inégalités)
            let feasible = true;
            for (let cIdx = 0; cIdx < n; cIdx++) {
              const [a, b_, c_] = constraints.coefficients[cIdx];
              const sign = constraints.signs[cIdx];
              const val = a*pt[0] + b_*pt[1] + c_*pt[2];
              const rhs = constraints.values[cIdx];
              if (sign === '<=' && val > rhs + 1e-6) feasible = false;
              if (sign === '>=' && val < rhs - 1e-6) feasible = false;
              if (sign === '=' && Math.abs(val - rhs) > 1e-6) feasible = false;
            }
            // Vérifier x, y, z >= 0
            if (pt[0] < -1e-6 || pt[1] < -1e-6 || pt[2] < -1e-6) feasible = false;
            if (feasible) {
              // Arrondir pour éviter les doublons numériques
              const rounded = pt.map(x => Math.round(x * 1e8) / 1e8);
              if (!vertices.some(v => v.every((x, idx) => Math.abs(x - rounded[idx]) < 1e-6))) {
                vertices.push(rounded);
              }
            }
          }
        }
      }
      // Tracer les sommets
      const verticesTrace = vertices.length > 0 ? {
        x: vertices.map(v => v[0]),
        y: vertices.map(v => v[1]),
        z: vertices.map(v => v[2]),
        mode: 'markers+text',
        type: 'scatter3d',
        marker: { size: 5, color: 'black' },
        text: vertices.map(v => `(${v[0].toFixed(1)}, ${v[1].toFixed(1)}, ${v[2].toFixed(1)})`),
        textposition: 'top right',
        name: 'Sommets',
        showlegend: true
      } : null;
      // Tracer le polyèdre réalisable (mesh3d)
      let meshTrace = null;
      if (vertices.length >= 4) {
        // On relie tous les sommets (convex hull)
        // Pour simplifier, on relie tous les triplets de sommets qui forment une face (naïf)
        // (Pour un vrai convex hull, utiliser quickhull-3d ou scipy.spatial.ConvexHull)
        // Ici, on relie tous les triplets qui sont sur une même face (tous les triplets)
        const I: number[] = [];
        const J: number[] = [];
        const K: number[] = [];
        for (let i = 0; i < vertices.length; i++) {
          for (let j = i+1; j < vertices.length; j++) {
            for (let k = j+1; k < vertices.length; k++) {
              I.push(i); J.push(j); K.push(k);
            }
          }
        }
        meshTrace = {
          type: 'mesh3d',
          x: vertices.map(v => v[0]),
          y: vertices.map(v => v[1]),
          z: vertices.map(v => v[2]),
          i: I, j: J, k: K,
          opacity: 0.15,
          color: 'red',
          name: 'Polyèdre réalisable',
          hoverinfo: 'skip',
          showlegend: true
        };
      }
      // Point solution optimale
      let solution3D = null
      if (solution.isValid && solution.coordinates.length === 3) {
        solution3D = {
          x: [solution.coordinates[0]],
          y: [solution.coordinates[1]],
          z: [solution.coordinates[2]],
          mode: 'markers+text',
          type: 'scatter3d',
          marker: { size: 8, color: 'red' },
          text: ['S'],
          textfont: { color: 'red', size: 24 },
          name: 'Solution optimale',
          showlegend: true
        }
      }
      setPlotData([
        ...(meshTrace ? [meshTrace] : []),
        ...constraintPlanes,
        ...(verticesTrace ? [verticesTrace] : []),
        ...(solution3D ? [solution3D] : [])
      ])
      setPlotLayout({
        title: 'Visualisation 3D (3 variables)',
        scene: {
          xaxis: { title: 'x₁', range: xRange, backgroundcolor: '#f8f8ff', gridcolor: '#bbb', zerolinecolor: '#888' },
          yaxis: { title: 'x₂', range: yRange, backgroundcolor: '#f8f8ff', gridcolor: '#bbb', zerolinecolor: '#888' },
          zaxis: { title: 'x₃', range: zRange, backgroundcolor: '#f8f8ff', gridcolor: '#bbb', zerolinecolor: '#888' }
        },
        autosize: true,
        legend: { x: 1, y: 1, xanchor: 'right', yanchor: 'top', traceorder: 'normal', font: { family: 'sans-serif', size: 10, color: '#000' }, bgcolor: 'rgba(255,255,255,0.7)', bordercolor: '#FFFFFF', borderwidth: 2 }
      })
      return
    }

    // Fallback pour >3 variables : afficher juste le point optimal projeté sur (x1, x2)
    if (objectiveFunction.length > 3) {
      let solutionPoint = null;
      if (solution.isValid && solution.coordinates.length >= 2) {
        solutionPoint = {
          x: [solution.coordinates[0]],
          y: [solution.coordinates[1]],
          mode: 'markers+text',
          type: 'scatter',
          name: `Solution Optimale (${solution.coordinates[0].toFixed(2)}, ${solution.coordinates[1].toFixed(2)})`,
          text: [`(${solution.coordinates[0].toFixed(2)}, ${solution.coordinates[1].toFixed(2)})`],
          textposition: 'top right',
          marker: {
            size: 12,
            color: 'rgb(255, 0, 0)'
          }
        };
      }
      setPlotData(solutionPoint ? [solutionPoint] : []);
      setPlotLayout({
        title: "Projection du point optimal (x₁, x₂)",
        xaxis: { title: 'x₁' },
        yaxis: { title: 'x₂' },
        autosize: true,
        annotations: [
          {
            text: "Visualisation complète impossible (>3 variables). Seul le point optimal projeté (x₁, x₂) est affiché.",
            xref: "paper", yref: "paper",
            x: 0.5, y: 1.05, showarrow: false,
            font: { size: 14, color: "red" }
          }
        ]
      });
      return;
    }

    if (objectiveFunction.length > 2) {
      console.warn('Seule la visualisation 2D est supportée')
      return
    }

    const xRange = [0, 20]
    const yRange = [0, 20]
    
    // Détection des contraintes actives (saturées à un sommet de la solution)
    const EPS = 1e-6;
    const feasiblePoint = solution.isValid ? solution.coordinates : null;
    // Une contrainte est active si elle est saturée à la solution optimale
    const activeConstraints = new Set<number>();
    if (feasiblePoint) {
      constraints.coefficients.forEach((coeffs, i) => {
        const lhs = coeffs[0] * feasiblePoint[0] + coeffs[1] * feasiblePoint[1];
        const rhs = constraints.values[i];
        const sign = constraints.signs[i];
        if ((sign === '<=' && Math.abs(lhs - rhs) < EPS) ||
            (sign === '>=' && Math.abs(lhs - rhs) < EPS) ||
            (sign === '=' && Math.abs(lhs - rhs) < EPS)) {
          activeConstraints.add(i);
        }
      });
    }
    const constraintColors = ['#e74c3c', '#27ae60', '#8e44ad', '#f39c12', '#16a085', '#34495e'];
    const constraintLines = constraints.coefficients.map((coeffs, i) => {
      const a = coeffs[0]
      const b = coeffs[1]
      const c = constraints.values[i]
      let xEndpoints: number[] = []
      let yEndpoints: number[] = []
      if (b !== 0) {
        const y = c / b
        if (y >= 0 && y <= yRange[1]) {
          xEndpoints.push(0)
          yEndpoints.push(y)
        }
      }
      if (a !== 0) {
        const x = c / a
        if (x >= 0 && x <= xRange[1]) {
          xEndpoints.push(x)
          yEndpoints.push(0)
        }
      }
      if (b !== 0) {
        const y = (c - a * xRange[1]) / b
        if (y >= 0 && y <= yRange[1]) {
          xEndpoints.push(xRange[1])
          yEndpoints.push(y)
        }
      }
      if (a !== 0) {
        const x = (c - b * yRange[1]) / a
        if (x >= 0 && x <= xRange[1]) {
          xEndpoints.push(x)
          yEndpoints.push(yRange[1])
        }
      }
      const pairs = xEndpoints.map((x, i) => ({ x, y: yEndpoints[i] }))
      pairs.sort((a, b) => a.x - b.x)
      xEndpoints = pairs.map(p => p.x)
      yEndpoints = pairs.map(p => p.y)
      // Style selon active ou non
      const isActive = activeConstraints.has(i);
      return {
        x: xEndpoints,
        y: yEndpoints,
        mode: 'lines',
        name: `${coeffs[0]}x₁ + ${coeffs[1]}x₂ ${constraints.signs[i]} ${constraints.values[i]}`,
        line: {
          color: isActive ? ['#FF5733', '#33FF57', '#3357FF', '#FFBD33', '#33FFBD'][i % 5] : 'gray',
          width: 2,
          dash: isActive ? 'solid' : 'dashdot'
        }
      }
    });
    
    const xAxisLine = {
      x: [0, xRange[1]],
      y: [0, 0],
      mode: 'lines',
      name: 'x₂ = 0',
      line: { color: 'gray', width: 2 }
    }
    
    const yAxisLine = {
      x: [0, 0],
      y: [0, yRange[1]],
      mode: 'lines',
      name: 'x₁ = 0',
      line: { color: 'gray', width: 2 }
    }
    
    let solutionPoint = null
    if (solution.isValid && solution.coordinates.length === 2) {
      solutionPoint = {
        x: [solution.coordinates[0]],
        y: [solution.coordinates[1]],
        mode: 'markers+text',
        type: 'scatter',
        name: `Solution Optimale (${solution.coordinates[0].toFixed(2)}, ${solution.coordinates[1].toFixed(2)})`,
        text: [`(${solution.coordinates[0].toFixed(2)}, ${solution.coordinates[1].toFixed(2)})`],
        textposition: 'top right',
        marker: {
          size: 10,
          color: 'rgb(255, 0, 0)'
        }
      } as any
    }
    
    const objFuncSlope = -objectiveFunction[0] / objectiveFunction[1]
    const objFuncIntercept = solution.isValid ? solution.value / objectiveFunction[1] : 5
    
    const objFuncLine = {
      x: [0, xRange[1]],
      y: [objFuncIntercept, objFuncIntercept + objFuncSlope * xRange[1]],
      mode: 'lines',
      name: `Z = ${objectiveFunction[0]}x₁ + ${objectiveFunction[1]}x₂`,
      line: {
        color: 'rgb(0, 0, 0)',
        width: 2,
        dash: 'dash'
      }
    }
    
    // Générer des hachures croisées, colorées, qui ne dépassent pas la droite
    function getCustomHatchSegments(a: number, b: number, c: number, sign: string, angle: number, color: string, isGreen: boolean) {
      const segments = [];
      const xStep = 0.5;
      const yStep = 0.5;
      const L = 1.2;
      const offset = 0.6;
      const dx = Math.cos(angle) * L / 2;
      const dy = Math.sin(angle) * L / 2;
      const norm = Math.sqrt(a * a + b * b);
      for (let x = 0; x <= xRange[1]; x += xStep) {
        for (let y = 0; y <= yRange[1]; y += yStep) {
          const d = (a * x + b * y - c) / norm;
          let isForbidden = false;
          let centerX = x, centerY = y;
          if (sign === '<=') isForbidden = d > 0.1 && d < 1.2;
          if (sign === '>=') isForbidden = d < -0.1 && -d < 1.2;
          if (isForbidden) {
            if (isGreen) {
              // Ancien style : hachure centrée, peut traverser la droite
              segments.push({
                x: [x - dx, x + dx],
                y: [y - dy, y + dy],
                color
              });
            } else {
              // Nouveau style : hachure décalée, ne dépasse pas la droite
              const nx = a / norm;
              const ny = b / norm;
              if (sign === '<=') {
                centerX = x - nx * (d - offset);
                centerY = y - ny * (d - offset);
              } else if (sign === '>=') {
                centerX = x - nx * (d + offset);
                centerY = y - ny * (d + offset);
              }
              segments.push({
                x: [centerX - dx, centerX + dx],
                y: [centerY - dy, centerY + dy],
                color
              });
            }
          }
        }
      }
      return segments;
    }
    // Ajout des hachures croisées et colorées pour chaque contrainte
    let hatchTraces: any[] = [];
    const hatchAngles = [Math.PI/4, -Math.PI/4, 0, Math.PI/2, Math.PI/3, -Math.PI/3];
    const hatchColors = ['#e74c3c', '#27ae60', '#8e44ad', '#f39c12', '#16a085', '#34495e'];
    constraints.coefficients.forEach((coeffs, i) => {
      const a = coeffs[0];
      const b = coeffs[1];
      const c = constraints.values[i];
      const sign = constraints.signs[i];
      if (sign === '<=' || sign === '>=') {
        const angle = hatchAngles[i % hatchAngles.length];
        const color = hatchColors[i % hatchColors.length];
        const isGreen = (i === 1); // contrainte verte
        const segments = getCustomHatchSegments(a, b, c, sign, angle, color, isGreen);
        segments.forEach(seg => {
          hatchTraces.push({
            x: seg.x,
            y: seg.y,
            mode: 'lines',
            line: { color: seg.color, width: 2 },
            showlegend: false,
            hoverinfo: 'skip',
            opacity: 0.7
          });
        });
      }
    });
    
    // Ajout du S rouge à la solution optimale
    let solutionSTrace = null;
    if (solution.isValid && solution.coordinates.length === 2) {
      solutionSTrace = {
        x: [solution.coordinates[0]],
        y: [solution.coordinates[1]],
        mode: 'markers+text',
        type: 'scatter',
        marker: {
          color: 'red',
          size: 22, // plus gros
          symbol: 'circle',
          line: { color: 'black', width: 2 }
        },
        text: ['S'],
        textfont: {
          color: 'red',
          size: 36, // plus gros
          family: 'Arial Black, Arial, sans-serif',
        },
        textposition: 'top center',
        showlegend: false,
        hoverinfo: 'skip'
      };
    }

    // Ajout du polygone rouge pour la zone réalisable (si disponible)
    let feasibleRegionTrace = null;
    const sol = solution as Solution2DOr3D;
    if (sol.isValid && sol.feasibleRegion) {
      const region = sol.feasibleRegion;
      // Fermer le polygone
      const xPoly = [...region.map((pt: [number, number]) => pt[0]), region[0][0]];
      const yPoly = [...region.map((pt: [number, number]) => pt[1]), region[0][1]];
      feasibleRegionTrace = {
        x: xPoly,
        y: yPoly,
        mode: 'lines',
        fill: 'toself',
        fillcolor: 'rgba(255,0,0,0.35)',
        line: { color: 'red', width: 3 },
        name: 'Zone Solution',
        showlegend: false,
        hoverinfo: 'skip'
      };
    }
    
    // --- Tracé des droites à partir des points du tableau (pour chaque contrainte) ---
    // Exemple de structure du tableau résultat (à adapter selon ton vrai tableau)
    const tableauResultat = [
      { points: [[0, 1000]] },                // 0x1 + 1x2 = 1000
      { points: [[450, 0]] },                 // 4x1 - 1x2 = 1800
      { points: [[0, 500]] },                 // -1x1 + 6x2 = 3000
      { points: [[2250, 0], [0, 1500]] },     // 2x1 + 3x2 = 4500
      { points: [[0, 0]] },                   // x1 = 0, x2 = 0
    ];
    // Génère le tableau des lignes à tracer à partir du tableau résultat
    const tableauLinesFromPoints = tableauResultat.map((row, i) => {
      if (!row.points || row.points.length < 2) return null;
      const sorted = [...row.points].sort((a, b) => a[0] - b[0]);
      return {
        x: sorted.map(p => p[0]),
        y: sorted.map(p => p[1]),
        mode: 'lines+markers+text',
        type: 'scatter',
        marker: { color: 'red', size: 4 },
        line: { color: 'red', width: 3 },
        text: sorted.map(([x, y]) => `(${x},${y})`),
        textposition: 'top right',
        name: `Droite tableau`
      };
    }).filter(Boolean);

    // Génère toutes les droites possibles entre chaque paire de points pour chaque contrainte
    const tableauAllSegments = tableauResultat.flatMap((row, i) => {
      if (!row.points || row.points.length < 2) return [];
      const segments = [];
      for (let j = 0; j < row.points.length; j++) {
        for (let k = j + 1; k < row.points.length; k++) {
          segments.push({
            x: [row.points[j][0], row.points[k][0]],
            y: [row.points[j][1], row.points[k][1]],
            mode: 'lines+markers',
            type: 'scatter',
            marker: { color: 'orange', size: 6 },
            line: { color: 'orange', width: 2, dash: 'dot' },
            name: `Segment (${row.points[j][0]},${row.points[j][1]})-(${row.points[k][0]},${row.points[k][1]})`
          });
        }
      }
      return segments;
    });
    
    // --- Tracé de la droite passant par le point optimal (même pente que la fonction objectif) ---
    let optimalLine = null;
    if (solution.isValid && solution.coordinates.length === 2) {
      // Cette droite a la même pente que la fonction objectif et passe par S (point optimal)
      const slope = -objectiveFunction[0] / objectiveFunction[1];
      const x0 = solution.coordinates[0];
      const y0 = solution.coordinates[1];
      // On trace la droite sur tout le domaine
      const xLine = [0, xRange[1]];
      const yLine = [y0 + slope * (0 - x0), y0 + slope * (xRange[1] - x0)];
      optimalLine = {
        x: xLine,
        y: yLine,
        mode: 'lines',
        line: { color: 'black', width: 3, dash: 'dash' },
        name: 'Droite de la fonction objectif passant par S'
      };
    }
    
    const data = [
      ...(feasibleRegionTrace ? [feasibleRegionTrace] : []),
      ...constraintLines,
      ...tableauLinesFromPoints,
      ...tableauAllSegments,
      ...hatchTraces,
      xAxisLine,
      yAxisLine,
      ...(solutionPoint ? [solutionPoint] : []),
      ...(solutionSTrace ? [solutionSTrace] : []),
      ...(optimalLine ? [optimalLine] : []),
      objFuncLine
    ];
    
    const layout = {
      title: 'Visualisation Graphique de la Solution',
      xaxis: {
        title: 'x₁',
        range: [0, Math.min(20, Math.max(...constraintLines.flatMap(line => line.x)) * 1.2)]
      },
      yaxis: {
        title: 'x₂',
        range: [0, Math.min(20, Math.max(...constraintLines.flatMap(line => line.y)) * 1.2)]
      },
      autosize: true,
      legend: {
        x: 1,
        y: 1,
        xanchor: 'right',
        yanchor: 'top',
        traceorder: 'normal',
        font: {
          family: 'sans-serif',
          size: 10,
          color: '#000'
        },
        bgcolor: 'rgba(255,255,255,0.7)',
        bordercolor: '#FFFFFF',
        borderwidth: 2
      }
    }
    
    setPlotData(data)
    setPlotLayout(layout)
  }, [constraints, objectiveFunction, problemType, solution])

  // Vérifier si la solution est réalisable et ne contient pas de NaN
  const isSolutionValid = solution.isValid && solution.coordinates.every(x => typeof x === 'number' && !isNaN(x) && isFinite(x));

  return (
    <Card className="modern-card p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"></div>
        <h2 className="text-2xl font-bold gradient-text">
          Visualisation - {method === 'graphical' ? 'Méthode Graphique' : 
                          method === 'simplex' ? 'Simplexe' : 'Forme Générale'}
        </h2>
      </div>
      <Separator className="my-4" />

      {!isSolutionValid ? (
        <div className="w-full h-[300px] flex items-center justify-center">
          <div className="text-red-500 text-lg font-semibold">Aucune solution réalisable trouvée pour ce problème.</div>
        </div>
      ) : (
        <>
          {objectiveFunction && objectiveFunction.length > 2 ? (
            <div className="w-full h-[500px]">
              {plotData.length > 0 && (
                <Plot
                  data={plotData}
                  layout={plotLayout}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                  config={{ responsive: true, displayModeBar: false }}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-[500px]">
              {plotData.length > 0 && (
                <Plot
                  data={plotData}
                  layout={plotLayout}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                  config={{ responsive: true, displayModeBar: false }}
                />
              )}
            </div>
          )}

          {solution.isValid && (
            <div className="mt-6 p-4 glass-effect rounded-xl border border-green-500/20">
              <h3 className="text-lg font-semibold mb-3 text-green-400">📊 Résumé de la Solution</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-200/70 mb-1">Valeur Optimale :</p>
                  <p className="text-xl font-bold text-green-400">Z = {solution.value.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-200/70 mb-1">Point Optimal :</p>
                  <p className="text-lg font-mono text-white">(
                {solution.coordinates.map((coord, i) => (
                  <span key={i}>
                    x<sub>{i+1}</sub> = {coord.toFixed(2)}
                    {i < solution.coordinates.length - 1 ? ', ' : ''}
                  </span>
                ))}
                  )</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}