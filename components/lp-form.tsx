"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { PlusCircle, MinusCircle, ChevronRightCircle, TargetIcon, ZapIcon, SettingsIcon } from 'lucide-react'
import type { SolutionMethod } from '@/app/page'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  problemType: z.enum(['max', 'min']),
  objectiveFunction: z.array(z.number()),
  constraintCoefficients: z.array(z.array(z.number())),
  constraintSigns: z.array(z.enum(['<=', '=', '>='])),
  constraintValues: z.array(z.number()),
})

type LPFormProps = {
  onSolve: (data: z.infer<typeof formSchema>) => void
  selectedMethod: SolutionMethod
}

export function LPForm({ onSolve, selectedMethod }: LPFormProps) {
  const [numVariables, setNumVariables] = useState(2)
  const [numConstraints, setNumConstraints] = useState(5)
  const [operator, setOperator] = useState<string>("+");
  const [constraintOperators, setConstraintOperators] = useState<string[]>(Array(5).fill("+"));
  // Ajout des états pour les signes de chaque coefficient
  const [objectiveSigns, setObjectiveSigns] = useState<string[]>(Array(2).fill('+'));
  const [constraintSigns, setConstraintSigns] = useState<string[][]>(Array(5).fill(null).map(() => Array(2).fill('+')));
  const defaultFormValues: z.infer<typeof formSchema> = {
    problemType: 'max',
    objectiveFunction: [1, 1],
    constraintCoefficients: [
      [2, -3],    // 2x1 - 3x2 <= 2
      [2, 1],     // 2x1 + x2 <= 11
      [-1, 1],    // -x1 + x2 <= 3
      [1, 0],     // x1 <= 4
      [0, 1],     // x2 <= 5
    ],
    constraintSigns: ['<=', '<=', '<=', '<=', '<='],
    constraintValues: [2, 11, 3, 4, 5],
  };
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  })

  const addVariable = () => {
    if (numVariables < 5) {
      const newObjectiveFunction = [...form.getValues().objectiveFunction, 0]
      const newConstraintCoefficients = form.getValues().constraintCoefficients.map(row => [...row, 0])
      
      form.setValue('objectiveFunction', newObjectiveFunction)
      form.setValue('constraintCoefficients', newConstraintCoefficients)
      setObjectiveSigns([...objectiveSigns, '+']);
      setConstraintSigns(constraintSigns.map(row => [...row, '+']));
      setNumVariables(numVariables + 1)
    }
  }

  const removeVariable = () => {
    if (numVariables > 2) {
      const newObjectiveFunction = [...form.getValues().objectiveFunction]
      newObjectiveFunction.pop()
      
      const newConstraintCoefficients = form.getValues().constraintCoefficients.map(row => {
        const newRow = [...row]
        newRow.pop()
        return newRow
      })
      
      form.setValue('objectiveFunction', newObjectiveFunction)
      form.setValue('constraintCoefficients', newConstraintCoefficients)
      setObjectiveSigns(objectiveSigns.slice(0, -1));
      setConstraintSigns(constraintSigns.map(row => row.slice(0, -1)));
      setNumVariables(numVariables - 1)
    }
  }

  const addConstraint = () => {
    if (numConstraints < 5) {
      const newConstraint = Array(numVariables).fill(0)
      const newConstraintCoefficients = [...form.getValues().constraintCoefficients, newConstraint]
      const newConstraintSigns = [...form.getValues().constraintSigns, '<=']
      const newConstraintValues = [...form.getValues().constraintValues, 0]
      
      form.setValue('constraintCoefficients', newConstraintCoefficients)
      const allowedSigns = ["<=", "=", ">="];
      form.setValue('constraintSigns', newConstraintSigns.filter(sign => allowedSigns.includes(sign)) as ("<=" | "=" | ">=")[])
      form.setValue('constraintValues', newConstraintValues)
      setConstraintOperators([...constraintOperators, "+"]);
      setConstraintSigns([...constraintSigns, Array(numVariables).fill('+')]);
      setNumConstraints(numConstraints + 1)
    }
  }

  const removeConstraint = () => {
    if (numConstraints > 2) {
      const newConstraintCoefficients = [...form.getValues().constraintCoefficients]
      newConstraintCoefficients.pop()
      
      const newConstraintSigns = [...form.getValues().constraintSigns]
      newConstraintSigns.pop()
      
      const newConstraintValues = [...form.getValues().constraintValues]
      newConstraintValues.pop()
      
      form.setValue('constraintCoefficients', newConstraintCoefficients)
      form.setValue('constraintSigns', newConstraintSigns)
      form.setValue('constraintValues', newConstraintValues)
      setConstraintOperators(constraintOperators.slice(0, -1));
      setConstraintSigns(constraintSigns.slice(0, -1));
      setNumConstraints(numConstraints - 1)
    }
  }

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Appliquer les signes aux coefficients
    const realObjective = data.objectiveFunction.map((val, i) => objectiveSigns[i] === '-' ? -Math.abs(val) : Math.abs(val));
    const realConstraints = data.constraintCoefficients.map((row, i) =>
      row.map((val, j) => constraintSigns[i][j] === '-' ? -Math.abs(val) : Math.abs(val))
    );
    onSolve({
      ...data,
      objectiveFunction: realObjective,
      constraintCoefficients: realConstraints
    });
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF9A00] shadow-lg">
            <SettingsIcon className="h-8 w-8 text-[#4F200D]" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-[#4F200D]">Configuration du Problème</h2>
        <p className="text-[#4F200D]/80 text-lg font-medium">
          {selectedMethod === 'graphical' && 'Méthode graphique - Limité à 2 variables'}
          {selectedMethod === 'simplex' && 'Algorithme du simplexe - Tableau détaillé'}
          {selectedMethod === 'general' && 'Forme générale - Approche matricielle'}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="problemType"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="form-label flex items-center space-x-3">
                  <TargetIcon className="h-5 w-5 text-[#FF9A00]" />
                  <span>Type de Problème</span>
                </FormLabel>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-8"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="max" className="radio-item" />
                    </FormControl>
                    <FormLabel className="font-bold text-[#4F200D] cursor-pointer text-lg">Maximiser</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="min" className="radio-item" />
                    </FormControl>
                    <FormLabel className="font-bold text-[#4F200D] cursor-pointer text-lg">Minimiser</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormItem>
            )}
          />

          <div className="space-y-6 glass-effect rounded-2xl p-8 border-2 border-[#4F200D]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#FFD93D] to-[#FF9A00]">
                  <ZapIcon className="h-5 w-5 text-[#4F200D]" />
                </div>
                <h3 className="text-xl font-bold text-[#4F200D]">Fonction Objectif</h3>
              </div>
              {selectedMethod !== 'graphical' && (
                <div className="flex space-x-3">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  className="border-2 border-[#FF9A00] text-[#4F200D] hover:bg-[#FFD93D]/20 font-semibold"
                  onClick={removeVariable}
                  disabled={numVariables <= 2}
                >
                  <MinusCircle className="h-4 w-4 mr-2" />
                  Variable
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  className="border-2 border-[#FF9A00] text-[#4F200D] hover:bg-[#FFD93D]/20 font-semibold"
                  onClick={addVariable}
                  disabled={numVariables >= 5}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Variable
                </Button>
              </div>
              )}
            </div>

            <div className="flex items-center space-x-4 p-6 bg-white/30 rounded-xl border-2 border-[#FF9A00]/30">
              <span className="text-2xl font-bold text-[#4F200D]">Z = </span>
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: numVariables }).map((_, index) => (
                  <div key={`obj-${index}`} className="flex items-center space-x-2">
                    <select
                      value={objectiveSigns[index]}
                      onChange={e => {
                        const newSigns = [...objectiveSigns];
                        newSigns[index] = e.target.value;
                        setObjectiveSigns(newSigns);
                      }}
                      className="form-select w-16 text-center font-bold"
                    >
                      <option value="+">+</option>
                      <option value="-">-</option>
                    </select>
                    <Input
                      className="form-input w-20 text-center font-bold"
                      type="number"
                      min={0}
                      {...form.register(`objectiveFunction.${index}`, { 
                        valueAsNumber: true,
                        onChange: (e) => {
                          const val = parseFloat(e.target.value) || 0
                          const current = [...form.getValues().objectiveFunction]
                          current[index] = val
                          form.setValue('objectiveFunction', current)
                        }
                      })}
                    />
                    <span className="text-xl font-bold text-[#4F200D]">x<sub>{index + 1}</sub></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator className="separator h-1" />

          <div className="space-y-6 glass-effect rounded-2xl p-8 border-2 border-[#4F200D]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#FFD93D] to-[#FF9A00]">
                  <TargetIcon className="h-5 w-5 text-[#4F200D]" />
                </div>
                <h3 className="text-xl font-bold text-[#4F200D]">Contraintes</h3>
              </div>
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  className="border-2 border-[#FF9A00] text-[#4F200D] hover:bg-[#FFD93D]/20 font-semibold"
                  onClick={removeConstraint}
                  disabled={numConstraints <= 2}
                >
                  <MinusCircle className="h-4 w-4 mr-2" />
                  Contrainte
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  className="border-2 border-[#FF9A00] text-[#4F200D] hover:bg-[#FFD93D]/20 font-semibold"
                  onClick={addConstraint}
                  disabled={numConstraints >= 5}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Contrainte
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: numConstraints }).map((_, constraintIndex) => (
                <div key={`constraint-${constraintIndex}`} className="flex flex-wrap gap-3 md:flex-row flex-col md:items-center p-4 bg-white/20 rounded-xl border-2 border-[#FF9A00]/20">
                  {Array.from({ length: numVariables }).map((_, varIndex) => (
                    <div key={`constraint-${constraintIndex}-var-${varIndex}`} className="flex items-center space-x-2">
                      <select
                        value={constraintSigns[constraintIndex][varIndex]}
                        onChange={e => {
                          const newSigns = constraintSigns.map(row => [...row]);
                          newSigns[constraintIndex][varIndex] = e.target.value;
                          setConstraintSigns(newSigns);
                        }}
                        className="form-select w-16 text-center font-bold"
                      >
                        <option value="+">+</option>
                        <option value="-">-</option>
                      </select>
                      <Input
                        className="form-input w-16 text-center font-bold"
                        type="number"
                        min={0}
                        {...form.register(`constraintCoefficients.${constraintIndex}.${varIndex}`, { 
                          valueAsNumber: true,
                          onChange: (e) => {
                            const val = parseFloat(e.target.value) || 0
                            const current = [...form.getValues().constraintCoefficients]
                            current[constraintIndex][varIndex] = val
                            form.setValue('constraintCoefficients', current)
                          }
                        })}
                      />
                      <span className="text-lg font-bold text-[#4F200D]">x<sub>{varIndex + 1}</sub></span>
                    </div>
                  ))}
                  
                  <select
                    className="form-select w-20 text-center font-bold"
                    {...form.register(`constraintSigns.${constraintIndex}`, {
                      onChange: (e) => {
                        const current = [...form.getValues().constraintSigns]
                        const allowedSigns = ["<=", "=", ">="];
                        const newConstraintSigns = [...current]
                        newConstraintSigns[constraintIndex] = e.target.value as any
                        form.setValue('constraintSigns', newConstraintSigns.filter(sign => allowedSigns.includes(sign)) as ("<=" | "=" | ">=")[])
                      }
                    })}
                  >
                    <option value="<=">≤</option>
                    <option value="=">=</option>
                    <option value=">=">≥</option>
                  </select>
                  
                  <Input
                    className="form-input w-20 text-center font-bold"
                    type="number"
                    min={0}
                    {...form.register(`constraintValues.${constraintIndex}`, { 
                      valueAsNumber: true,
                      onChange: (e) => {
                        const val = parseFloat(e.target.value) || 0
                        const current = [...form.getValues().constraintValues]
                        current[constraintIndex] = val
                        form.setValue('constraintValues', current)
                      }
                    })}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator className="separator h-1" />

          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#FFD93D]/20 to-[#FF9A00]/20 rounded-xl border-2 border-[#4F200D]/20">
            <FormDescription>
              <span className="text-[#4F200D]/80 font-medium text-lg">
                Configurez votre problème et cliquez sur Résoudre pour obtenir la solution optimale.
              </span>
            </FormDescription>
            <Button type="submit" size="lg" className="modern-button gap-3">
              <span>Résoudre</span>
              <ChevronRightCircle className="h-6 w-6" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}