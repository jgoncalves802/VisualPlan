

/**
 * CalendarEditor - Manage working calendars
 */



import React, { useState } from 'react';
import type { CalendarStore } from '../stores/calendar-store';
import type { WorkingCalendar, Holiday, CalendarException } from '../types/advanced-features';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Copy,
  Clock,
  Sun,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

interface CalendarEditorProps {
  calendarStore: CalendarStore;
}

export function CalendarEditor({ calendarStore }: CalendarEditorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarDesc, setNewCalendarDesc] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayRecurring, setNewHolidayRecurring] = useState(false);

  const calendars = calendarStore.getCalendars();
  const activeCalendar = calendarStore.getActiveCalendar();

  const selectedCalendar = selectedCalendarId 
    ? calendars.find(c => c.id === selectedCalendarId)
    : calendars[0];

  // Day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Create new calendar
  const handleCreateCalendar = () => {
    if (!newCalendarName.trim()) return;

    const newCalendar: WorkingCalendar = {
      id: `calendar-${Date.now()}`,
      name: newCalendarName,
      description: newCalendarDesc,
      timeZone: 'America/New_York',
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      workingDays: [
        { dayOfWeek: 1, isWorking: true },
        { dayOfWeek: 2, isWorking: true },
        { dayOfWeek: 3, isWorking: true },
        { dayOfWeek: 4, isWorking: true },
        { dayOfWeek: 5, isWorking: true },
        { dayOfWeek: 0, isWorking: false },
        { dayOfWeek: 6, isWorking: false }
      ],
      holidays: [],
      exceptions: []
    };

    calendarStore.addCalendar(newCalendar);
    setNewCalendarName('');
    setNewCalendarDesc('');
    setIsCreateDialogOpen(false);
  };

  // Add holiday
  const handleAddHoliday = () => {
    if (!selectedCalendar || !newHolidayName.trim() || !newHolidayDate) return;

    const holiday: Holiday = {
      id: `holiday-${Date.now()}`,
      name: newHolidayName,
      date: new Date(newHolidayDate),
      recurring: newHolidayRecurring,
      type: 'public'
    };

    calendarStore.addHoliday(selectedCalendar.id, holiday);

    setNewHolidayName('');
    setNewHolidayDate('');
    setNewHolidayRecurring(false);
    setIsHolidayDialogOpen(false);
  };

  // Delete holiday
  const handleDeleteHoliday = (calendarId: string, holidayId: string) => {
    calendarStore.removeHoliday(calendarId, holidayId);
  };

  // Clone calendar
  const handleCloneCalendar = (id: string) => {
    const original = calendars.find(c => c.id === id);
    if (original) {
      calendarStore.cloneCalendar(id, `${original.name} (Copy)`);
    }
  };

  // Delete calendar
  const handleDeleteCalendar = (id: string) => {
    if (calendars.length <= 1) return;
    calendarStore.deleteCalendar(id);
    if (selectedCalendarId === id) {
      setSelectedCalendarId(calendars[0]?.id ?? null);
    }
  };

  // Toggle working day
  const handleToggleWorkingDay = (dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6) => {
    if (!selectedCalendar) return;

    const updatedWorkingDays = selectedCalendar.workingDays.map(wd =>
      wd.dayOfWeek === dayOfWeek ? { ...wd, isWorking: !wd.isWorking } : wd
    );

    calendarStore.updateCalendar(selectedCalendar.id, {
      workingDays: updatedWorkingDays
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-green-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Calendar Editor</h2>
              <p className="text-sm text-gray-600">
                {calendars.length} calendars · Active: {activeCalendar?.name ?? 'None'}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New Calendar
          </Button>
        </div>

        {/* Calendar Selector */}
        <div className="mt-4">
          <Select
            value={selectedCalendarId ?? calendars[0]?.id ?? ''}
            onValueChange={setSelectedCalendarId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a calendar" />
            </SelectTrigger>
            <SelectContent>
              {calendars.map((calendar) => (
                <SelectItem key={calendar.id} value={calendar.id}>
                  {calendar.name}
                  {calendar.id === activeCalendar?.id && ' (Active)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {selectedCalendar ? (
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="working-days" className="h-full">
            <TabsList className="px-6 pt-4">
              <TabsTrigger value="working-days">Working Days</TabsTrigger>
              <TabsTrigger value="holidays">
                Holidays ({selectedCalendar.holidays.length})
              </TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Working Days Tab */}
            <TabsContent value="working-days" className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Working Days Configuration
                  </h3>
                  
                  <div className="space-y-2">
                    {selectedCalendar.workingDays.map((wd) => (
                      <Card
                        key={wd.dayOfWeek}
                        className={`p-4 ${wd.isWorking ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sun
                              className={wd.isWorking ? 'text-green-600' : 'text-gray-400'}
                              size={20}
                            />
                            <div>
                              <h4 className="font-medium">{dayNames[wd.dayOfWeek]}</h4>
                              <p className="text-sm text-gray-600">
                                {wd.isWorking ? 'Working day' : 'Non-working day'}
                              </p>
                            </div>
                          </div>

                          <Checkbox
                            checked={wd.isWorking}
                            onCheckedChange={() => handleToggleWorkingDay(wd.dayOfWeek)}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Working Hours */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="text-gray-600" size={18} />
                    <h4 className="font-medium">Default Working Hours</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={selectedCalendar.defaultStartTime}
                        onChange={(e) =>
                          calendarStore.updateCalendar(selectedCalendar.id, {
                            defaultStartTime: e.target.value
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={selectedCalendar.defaultEndTime}
                        onChange={(e) =>
                          calendarStore.updateCalendar(selectedCalendar.id, {
                            defaultEndTime: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Holidays Tab */}
            <TabsContent value="holidays" className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    Holidays & Non-Working Days
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedCalendarId(selectedCalendar.id);
                      setIsHolidayDialogOpen(true);
                    }}
                  >
                    <Plus size={14} className="mr-1" />
                    Add Holiday
                  </Button>
                </div>

                {selectedCalendar.holidays.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CalendarIcon className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600">No holidays defined</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Add holidays to mark non-working days
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {selectedCalendar.holidays.map((holiday) => (
                      <Card key={holiday.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{holiday.name}</h4>
                              {holiday.recurring && (
                                <Badge variant="secondary">Recurring</Badge>
                              )}
                              <Badge variant="outline">{holiday.type}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {holiday.date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(selectedCalendar.id, holiday.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="px-6 pb-6">
              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Calendar Information</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={selectedCalendar.name}
                        onChange={(e) =>
                          calendarStore.updateCalendar(selectedCalendar.id, {
                            name: e.target.value
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={selectedCalendar.description ?? ''}
                        onChange={(e) =>
                          calendarStore.updateCalendar(selectedCalendar.id, {
                            description: e.target.value
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Timezone</Label>
                      <Input
                        value={selectedCalendar.timeZone ?? 'America/New_York'}
                        onChange={(e) =>
                          calendarStore.updateCalendar(selectedCalendar.id, {
                            timeZone: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Actions</h4>
                  <div className="flex items-center gap-2">
                    {selectedCalendar.id !== activeCalendar?.id && (
                      <Button
                        variant="outline"
                        onClick={() => calendarStore.setActiveCalendar(selectedCalendar.id)}
                      >
                        Set as Active
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleCloneCalendar(selectedCalendar.id)}
                    >
                      <Copy size={14} className="mr-1" />
                      Clone Calendar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteCalendar(selectedCalendar.id)}
                      disabled={calendars.length <= 1}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No calendar selected</p>
          </div>
        </div>
      )}

      {/* Create Calendar Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Calendar</DialogTitle>
            <DialogDescription>
              Create a new working calendar with custom settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="calendar-name">Calendar Name</Label>
              <Input
                id="calendar-name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                placeholder="e.g., Standard Work Week, 24/7 Operations"
              />
            </div>

            <div>
              <Label htmlFor="calendar-desc">Description</Label>
              <Textarea
                id="calendar-desc"
                value={newCalendarDesc}
                onChange={(e) => setNewCalendarDesc(e.target.value)}
                placeholder="Describe this calendar..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCalendar} disabled={!newCalendarName.trim()}>
              Create Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Holiday Dialog */}
      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Add a holiday or non-working day to the calendar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="holiday-name">Holiday Name</Label>
              <Input
                id="holiday-name"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="e.g., New Year, Christmas"
              />
            </div>

            <div>
              <Label htmlFor="holiday-date">Date</Label>
              <Input
                id="holiday-date"
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="holiday-recurring"
                checked={newHolidayRecurring}
                onCheckedChange={(checked) => setNewHolidayRecurring(checked as boolean)}
              />
              <Label htmlFor="holiday-recurring" className="cursor-pointer">
                Recurring (repeats every year)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddHoliday}
              disabled={!newHolidayName.trim() || !newHolidayDate}
            >
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

