"use client"

import { useState } from 'react'
import { LPForm } from '@/components/lp-form'
import { LPVisualization } from '@/components/lp-visualization'
import { ResultsTable } from '@/components/results-table'
import { solveLPProblem, type LPProblem, type LPSolution } from '@/lib/lp-solver'
import { Card, CardContent } from '@/components/ui/card'
import { CalculatorIcon, SparklesIcon, TargetIcon, BrainIcon, ZapIcon } from 'lucide-react'

export type SolutionMethod = 'graphical' | 'simplex' | 'general'

export default function Home() {
  const [solution, setSolution] = useState<LPSolution | null>(null)
  const [problem, setProblem] = useState<LPProblem | null>(null)
  // Méthode unique: graphique
  const selectedMethod: SolutionMethod = 'graphical'
  
  const handleSolve = (formData: LPProblem) => {
    setProblem(formData)
    const result = solveLPProblem(formData, 'graphical')
    setSolution(result)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F1E9] via-[#FFD93D] to-[#FF9A00]">
      {/* Header moderne avec effet glassmorphism */}
      <header className="sticky top-0 z-50 w-full glass-effect border-b-2 border-[#4F200D]/20">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FFD93D] to-[#FF9A00] shadow-lg">
              <TargetIcon className="h-8 w-8 text-[#4F200D]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4F200D]">
                Maharavo M1 IG Toliara
              </h1>
              <p className="text-sm text-[#4F200D]/70 font-medium">
                Porjet RO- Programmation Linéaire Graphique 
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-12 px-6 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl glass-effect border-2 border-[#4F200D]/20 p-8 md:p-14">
          {/* decorative blobs */}
          <span className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-[#FFD93D]/40 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-[#FF9A00]/30 blur-2xl" />

          <div className="relative z-10 grid gap-8 md:grid-cols-12 items-center">
            <div className="md:col-span-7 text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/40 border-2 border-[#FF9A00]/40 px-4 py-2 text-sm font-semibold text-[#4F200D]">
                <SparklesIcon className="h-4 w-4" />
                Optimisation rapide & visualisée
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold leading-tight text-[#4F200D]">
                Résolvez vos problèmes de
                <br />
                <span className="bg-gradient-to-r from-[#FF9A00] to-[#4F200D] bg-clip-text text-transparent">programmation linéaire</span>
              </h2>
              <p className="text-[#4F200D]/80 text-lg md:text-xl max-w-2xl md:max-w-none font-medium">
                Saisissez vos contraintes et visualisez la solution graphique en 2D.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 text-sm text-[#4F200D]/80">
                <div className="rounded-full bg-white/50 border border-[#FF9A00]/30 px-3 py-1">Méthode Graphique</div>
                <div className="rounded-full bg-white/50 border border-[#FF9A00]/30 px-3 py-1">Visualisation 2D</div>
                <div className="rounded-full bg-white/50 border border-[#FF9A00]/30 px-3 py-1">Sommet optimal</div>
              </div>
            </div>
            <div className="md:col-span-5 flex justify-center md:justify-end">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#FFD93D]/40 to-[#FF9A00]/40 blur-xl" />
                <div className="relative p-6 rounded-3xl bg-white/50 border-2 border-[#FF9A00]/30 shadow-xl">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF9A00] shadow-md">
                      <BrainIcon className="h-12 w-12 text-[#4F200D]" />
                    </div>
                  </div>
                  <p className="text-center text-[#4F200D] font-semibold">Visualisation intégrée</p>
                  <p className="text-center text-[#4F200D]/70 text-sm">Tableaux, courbes, zone réalisable</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Formulaire principal */}
        <div className="modern-card p-8 border-2 border-[#4F200D]/20">
          <LPForm onSolve={handleSolve} selectedMethod={selectedMethod} />
        </div>
        
        {/* Résultats */}
        {solution && (
          <div className="space-y-8">
            {solution.isValid ? (
              <>
                {/* Résumé de la solution */}
                <Card className="success-card">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="p-3 rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF9A00]">
                        <SparklesIcon className="h-8 w-8 text-[#4F200D]" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#4F200D]">Solution Optimale Trouvée</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3 p-6 bg-white/30 rounded-xl border-2 border-[#FF9A00]/30">
                        <p className="text-sm text-[#4F200D]/70 font-semibold uppercase tracking-wide">Point optimal :</p>
                        <p className="text-xl font-mono text-[#4F200D] font-bold">
                          ({solution.coordinates.map(c => c.toFixed(3)).join(', ')})
                        </p>
                      </div>
                      <div className="space-y-3 p-6 bg-gradient-to-r from-[#FFD93D]/30 to-[#FF9A00]/30 rounded-xl border-2 border-[#4F200D]/30">
                        <p className="text-sm text-[#4F200D]/70 font-semibold uppercase tracking-wide">Valeur optimale :</p>
                        <p className="text-3xl font-bold text-[#4F200D]">
                          Z = {solution.value.toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Visualisation */}
                <div className="mt-8">
                  {problem && solution && (
                    problem.objectiveFunction.length === 2 ? (
                      <LPVisualization
                        constraints={{
                          coefficients: problem.constraintCoefficients,
                          signs: problem.constraintSigns,
                          values: problem.constraintValues
                        }}
                        objectiveFunction={problem.objectiveFunction}
                        problemType={problem.problemType}
                        solution={solution}
                        method={'graphical'}
                      />
                    ) : (
                      <div className="warning-card p-6">
                        <div className="flex items-center space-x-3">
                          <ZapIcon className="h-6 w-6 text-[#4F200D]" />
                          <p className="text-[#4F200D] font-semibold">
                            ⚠️ La visualisation graphique n'est disponible que pour les problèmes à 2 variables.
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Tableau des résultats */}
                {solution.tableData && (
                  <Card className="modern-card border-2 border-[#4F200D]/20">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-[#4F200D] mb-4">Tableau des Résultats</h3>
                      <ResultsTable 
                        tableData={solution.tableData} 
                        method={'graphical'}
                        iterations={solution.iterations}
                        canonicalForm={solution.canonicalForm}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Explication détaillée */}
                <Card className="modern-card border-2 border-[#4F200D]/20">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#FFD93D] to-[#FF9A00]">
                        <CalculatorIcon className="h-6 w-6 text-[#4F200D]" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#4F200D]">
                        Explication de la Résolution (Méthode Graphique)
                      </h3>
                    </div>
                    <div className="space-y-6 text-[#4F200D]/90">
                      <div className="p-6 bg-white/20 rounded-xl border-2 border-[#FF9A00]/20">
                        <h4 className="font-bold mb-3 text-[#4F200D] text-lg">1. Formulation du Problème</h4>
                        <p className="mb-3 font-medium">Fonction objectif : {problem?.problemType === 'max' ? 'Maximiser' : 'Minimiser'} Z = 
                          {problem?.objectiveFunction.map((coeff, idx) => 
                            ` ${coeff >= 0 && idx > 0 ? '+' : ''} ${coeff}x${idx + 1}`
                          )}
                        </p>
                        <p className="mb-2 font-medium">Sous les contraintes :</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          {problem?.constraintCoefficients.map((coeffs, idx) => (
                            <li key={idx} className="font-mono text-sm bg-white/30 p-2 rounded border border-[#FF9A00]/20">
                              {coeffs.map((coeff, cIdx) => 
                                `${coeff >= 0 && cIdx > 0 ? '+' : ''} ${coeff}x${cIdx + 1}`
                              ).join('')} {problem.constraintSigns[idx]} {problem.constraintValues[idx]}
                            </li>
                          ))}
                          <li className="font-semibold">x₁, x₂ ≥ 0</li>
                        </ul>
                      </div>

                      <div className="p-6 bg-gradient-to-r from-[#FFD93D]/20 to-[#FF9A00]/20 rounded-xl border-2 border-[#4F200D]/20">
                        <h4 className="font-bold mb-3 text-[#4F200D] text-lg">2. Méthode de Résolution</h4>
                        <p className="text-[#4F200D]/90">La méthode graphique trouve la solution en identifiant les points d'intersection des contraintes et en évaluant la fonction objectif à chaque sommet de la région réalisable.</p>
                      </div>

                      <div className="p-6 bg-white/20 rounded-xl border-2 border-[#FF9A00]/20">
                        <h4 className="font-bold mb-3 text-[#4F200D] text-lg">3. Interprétation</h4>
                        <p className="mb-3 font-medium">Pour {problem?.problemType === 'max' ? 'maximiser' : 'minimiser'} la fonction objectif :</p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                          {solution.coordinates.map((coord, idx) => (
                            <li key={idx} className="bg-gradient-to-r from-[#FFD93D]/30 to-[#FF9A00]/30 p-2 rounded border border-[#4F200D]/20">
                              Produire {coord.toFixed(3)} unités de x{idx + 1}
                            </li>
                          ))}
                          <li className="font-bold text-[#4F200D] bg-gradient-to-r from-[#FFD93D] to-[#FF9A00] p-3 rounded-lg border-2 border-[#4F200D]/30">
                            Valeur optimale : {solution.value.toFixed(3)}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="error-card">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                      <span className="text-3xl">⚠️</span>
                    </div>
                    <h3 className="text-2xl font-bold text-red-800">Aucune Solution Trouvée</h3>
                    <p className="text-red-700/80 text-lg">
                      Le problème n'a pas de solution réalisable ou est non borné. 
                      Veuillez vérifier vos contraintes et réessayer.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}