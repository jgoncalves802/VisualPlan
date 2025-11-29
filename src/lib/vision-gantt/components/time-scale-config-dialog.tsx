
/**
 * TimeScaleConfigDialog - Configure timeline layers similar to MS Project
 */



import React, { useState } from 'react';
import type { ViewPresetConfig, TimeScaleLayer, TimeUnit } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Separator } from '../../../components/ui/separator';

interface TimeScaleConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: ViewPresetConfig;
  onSave: (config: ViewPresetConfig) => void;
}

// Available time units
const TIME_UNITS: { value: TimeUnit; label: string }[] = [
  { value: 'hour', label: 'Hours' },
  { value: 'day', label: 'Days' },
  { value: 'week', label: 'Weeks' },
  { value: 'month', label: 'Months' },
  { value: 'quarter', label: 'Quarters' },
  { value: 'year', label: 'Years' }
];

// Format options for each unit type
const FORMAT_OPTIONS: Record<TimeUnit, { value: string; label: string }[]> = {
  hour: [
    { value: 'HH:mm', label: '14:30' },
    { value: 'h:mm a', label: '2:30 PM' },
    { value: 'HH', label: '14' },
    { value: 'h a', label: '2 PM' }
  ],
  day: [
    { value: 'd', label: '1, 2, 3...' },
    { value: 'EEE d', label: 'Mon 1, Tue 2...' },
    { value: 'dd', label: '01, 02, 03...' },
    { value: 'MMM d', label: 'Jan 1, Jan 2...' },
    { value: 'EEE, MMM d', label: 'Mon, Jan 1' }
  ],
  week: [
    { value: "'W'w", label: 'W1, W2, W3...' },
    { value: "'Week' w", label: 'Week 1, Week 2...' },
    { value: "w", label: '1, 2, 3...' }
  ],
  month: [
    { value: 'MMM', label: 'Jan, Feb, Mar...' },
    { value: 'MMMM', label: 'January, February...' },
    { value: 'MMM yyyy', label: 'Jan 2025' },
    { value: 'MMMM yyyy', label: 'January 2025' },
    { value: 'MM/yyyy', label: '01/2025' }
  ],
  quarter: [
    { value: "'Q'Q", label: 'Q1, Q2, Q3, Q4' },
    { value: "'Q'Q yyyy", label: 'Q1 2025' },
    { value: "'Quarter' Q", label: 'Quarter 1' }
  ],
  year: [
    { value: 'yyyy', label: '2025' },
    { value: 'yy', label: '25' }
  ]
};

export function TimeScaleConfigDialog({
  open,
  onOpenChange,
  currentConfig,
  onSave
}: TimeScaleConfigDialogProps) {
  const [config, setConfig] = useState<ViewPresetConfig>(currentConfig);
  const [activeTab, setActiveTab] = useState('0');

  // Ensure we have at least one layer
  const layers: TimeScaleLayer[] = config.headerLevels.length > 0 
    ? config.headerLevels 
    : [{ unit: 'day' as TimeUnit, format: 'd', align: 'center', showSeparators: true, height: 32, increment: 1 }];

  const updateLayer = (index: number, updates: Partial<TimeScaleLayer>) => {
    const newLayers = [...layers];
    newLayers[index] = { ...newLayers[index], ...updates };
    setConfig({ ...config, headerLevels: newLayers });
  };

  const addLayer = () => {
    if (layers.length < 3) {
      const newLayers: TimeScaleLayer[] = [...layers, { 
        unit: 'day' as TimeUnit, 
        format: 'd', 
        align: 'center', 
        showSeparators: true, 
        height: 32,
        increment: 1
      }];
      setConfig({ ...config, headerLevels: newLayers });
      setActiveTab(String(newLayers.length - 1));
    }
  };

  const removeLayer = (index: number) => {
    if (layers.length > 1) {
      const newLayers = layers.filter((_, i) => i !== index);
      setConfig({ ...config, headerLevels: newLayers });
      setActiveTab('0');
    }
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  const handleReset = () => {
    setConfig(currentConfig);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="pb-4 border-b px-6 pt-6">
          <DialogTitle className="text-xl font-semibold">Time Scale Configuration</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configure timeline layers, formats, and display options similar to MS Project
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {/* Base Configuration */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-600 rounded"></span>
              Base Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeUnit" className="text-xs font-medium text-gray-700">
                  Base Time Unit
                </Label>
                <Select
                  value={config.timeUnit}
                  onValueChange={(value) => setConfig({ ...config, timeUnit: value as TimeUnit })}
                >
                  <SelectTrigger id="timeUnit" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tickWidth" className="text-xs font-medium text-gray-700">
                  Column Width (pixels)
                </Label>
                <Input
                  id="tickWidth"
                  type="number"
                  min={20}
                  max={300}
                  value={config.columnWidth ?? config.tickWidth}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    columnWidth: parseInt(e.target.value) || 60 
                  })}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline Layers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-600 rounded"></span>
                Timeline Layers
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={addLayer}
                disabled={layers.length >= 3}
                className="text-xs"
              >
                + Add Layer
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${layers.length}, 1fr)` }}>
                {layers.map((layer, index) => (
                  <TabsTrigger key={index} value={String(index)} className="text-sm">
                    {index === 0 ? 'Top' : index === 1 ? 'Middle' : 'Bottom'} Layer
                  </TabsTrigger>
                ))}
              </TabsList>

              {layers.map((layer, index) => (
                <TabsContent key={index} value={String(index)} className="space-y-4 mt-4 bg-gray-50 rounded-lg p-4">
                  {/* Layer Info */}
                  <div className="text-xs text-gray-600 mb-3">
                    Configure the appearance and format for the {index === 0 ? 'top' : index === 1 ? 'middle' : 'bottom'} layer of the timeline header
                  </div>

                  {/* Grid Layout for Fields */}
                  <div className="space-y-4">
                    {/* Row 1: Unit & Format */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`unit-${index}`} className="text-xs font-medium text-gray-700">
                          Time Unit
                        </Label>
                        <Select
                          value={layer.unit}
                          onValueChange={(value) => updateLayer(index, { 
                            unit: value as TimeUnit,
                            format: FORMAT_OPTIONS[value as TimeUnit][0].value
                          })}
                        >
                          <SelectTrigger id={`unit-${index}`} className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`format-${index}`} className="text-xs font-medium text-gray-700">
                          Display Format
                        </Label>
                        <Select
                          value={layer.format}
                          onValueChange={(value) => updateLayer(index, { format: value })}
                        >
                          <SelectTrigger id={`format-${index}`} className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(FORMAT_OPTIONS[layer.unit] ?? []).map((fmt: { value: string; label: string }) => (
                              <SelectItem key={fmt.value} value={fmt.value}>
                                {fmt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 2: Alignment & Height */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`align-${index}`} className="text-xs font-medium text-gray-700">
                          Text Alignment
                        </Label>
                        <Select
                          value={layer.align ?? 'center'}
                          onValueChange={(value) => updateLayer(index, { align: value as 'left' | 'center' | 'right' })}
                        >
                          <SelectTrigger id={`align-${index}`} className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`height-${index}`} className="text-xs font-medium text-gray-700">
                          Height (px)
                        </Label>
                        <Input
                          id={`height-${index}`}
                          type="number"
                          min={24}
                          max={60}
                          value={layer.height ?? 32}
                          onChange={(e) => updateLayer(index, { 
                            height: parseInt(e.target.value) || 32 
                          })}
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`increment-${index}`} className="text-xs font-medium text-gray-700">
                          Increment
                        </Label>
                        <Input
                          id={`increment-${index}`}
                          type="number"
                          min={1}
                          max={12}
                          value={layer.increment ?? 1}
                          onChange={(e) => updateLayer(index, { 
                            increment: parseInt(e.target.value) || 1 
                          })}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    {/* Row 3: Checkbox */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={layer.showSeparators !== false}
                          onChange={(e) => updateLayer(index, { 
                            showSeparators: e.target.checked 
                          })}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Show vertical separators</span>
                      </label>

                      {layers.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLayer(index)}
                          className="text-xs h-8"
                        >
                          Remove This Layer
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        <DialogFooter className="pt-4 pb-6 px-6 border-t mt-auto">
          <Button variant="outline" onClick={handleReset} className="mr-auto">
            Reset to Default
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Apply Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
