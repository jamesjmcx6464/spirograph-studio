import { useMemo } from 'react';
import { BottomToolbar } from './components/BottomToolbar';
import { CompassCanvas } from './components/CompassCanvas';
import { ExportImageDialog } from './components/ExportImageDialog';
import { GearTrainSheet } from './components/GearTrainSheet';
import { LayersSwitchboardOverlay } from './components/LayersSwitchboardOverlay';
import { LearnSheet } from './components/LearnSheet';
import { LoadSheet } from './components/LoadSheet';
import { PresetsSheet } from './components/PresetsSheet';
import { SavePresetDialog } from './components/SavePresetDialog';
import { SettingsSheet } from './components/SettingsSheet';
import { TopHeaderBar } from './components/TopHeaderBar';
import { THEME } from './constants/palette';
import { useSpirographEngine } from './hooks/useSpirographEngine';
import { ActiveSheet } from './types/spirograph';
import { computeChain } from './utils/gearMath';

export default function App() {
  const engine = useSpirographEngine();
  const { uiState } = engine;

  const resolvedChain = useMemo(() => computeChain(uiState.circles), [uiState.circles]);

  const visibleExportStrokes = useMemo(() => {
    if (!uiState.showExportDialog) return [];
    const hidden = new Set(uiState.hiddenLayerIds);
    return engine.getStrokesSnapshot().filter((s) => !hidden.has(s.id));
  }, [uiState.showExportDialog, uiState.hiddenLayerIds, engine]);

  return (
    <main
      className="app-shell relative w-screen overflow-hidden select-none safe-area-pad"
      style={{ backgroundColor: THEME.CanvasBg }}
    >
      {/* 1. Fullscreen Simulation Canvas */}
      <CompassCanvas
        uiStateRef={engine.uiStateRef}
        liveCirclesRef={engine.liveCirclesRef}
        strokesRef={engine.strokesRef}
        onTick={engine.onSimulationTick}
        onPan={engine.onPan}
        onZoom={engine.onZoom}
        onEndPenTapped={engine.addCircle}
      />

      {/* 2. Top Header Bar */}
      <TopHeaderBar
        isPlaying={uiState.isPlaying}
        isLayersOpen={uiState.showLayersDashboard}
        onTogglePlayPause={engine.togglePlayPause}
        onOpenPresets={() => engine.setActiveSheet(ActiveSheet.PRESETS)}
        onOpenExport={() => engine.setShowExportDialog(true)}
        onToggleLayers={engine.toggleLayersDashboard}
        onOpenLearn={() => engine.setActiveSheet(ActiveSheet.LEARN)}
      />

      {/* 2.5 Layers Switchboard Overlay */}
      <LayersSwitchboardOverlay
        visible={uiState.showLayersDashboard}
        circles={uiState.circles}
        hiddenLayerIds={uiState.hiddenLayerIds}
        onDismiss={() => engine.setShowLayersDashboard(false)}
        onToggleLayerVisibility={engine.toggleLayerVisibility}
        onShowAllLayers={engine.showAllLayers}
        onHideAllLayers={engine.hideAllLayers}
        onClearLayerStrokes={engine.clearLayerStrokes}
        onToggleGearPen={engine.setCirclePen}
      />

      {/* 3. Bottom Toolbar */}
      <BottomToolbar
        circleCount={uiState.circles.length}
        activeSheet={uiState.activeSheet}
        onOpenGears={() => engine.setActiveSheet(ActiveSheet.GEARS)}
        onOpenLoad={() => engine.setActiveSheet(ActiveSheet.LOAD)}
        onOpenSettings={() => engine.setActiveSheet(ActiveSheet.SETTINGS)}
      />

      {/* 4. Modal Bottom Sheets */}
      {uiState.activeSheet === ActiveSheet.GEARS && (
        <GearTrainSheet
          circles={uiState.circles}
          resolvedChain={resolvedChain}
          onDismiss={() => engine.setActiveSheet(ActiveSheet.NONE)}
          onAddCircle={engine.addCircle}
          onLayerCircle={engine.layerCircle}
          onRemoveCircle={engine.removeCircle}
          onSetMode={engine.setCircleMode}
          onSetPen={engine.setCirclePen}
          onSetColor={engine.setCircleColor}
          onSetRadius={engine.setCircleRadius}
          onSetSpeed={engine.setCircleSpeed}
          onResetDrawing={engine.resetDrawing}
        />
      )}

      {uiState.activeSheet === ActiveSheet.LOAD && (
        <LoadSheet
          exportFormat={uiState.exportFormat}
          exportedCode={uiState.exportedCode}
          codeMessage={uiState.codeMessage}
          isSuccessMessage={uiState.isSuccessMessage}
          onDismiss={() => engine.setActiveSheet(ActiveSheet.NONE)}
          onFormatChange={engine.setExportFormat}
          onImportCode={engine.importSetupCode}
          onClearCodeMessage={engine.clearCodeMessage}
          onOpenPresetsGallery={() => engine.setActiveSheet(ActiveSheet.PRESETS)}
        />
      )}

      {uiState.activeSheet === ActiveSheet.SETTINGS && (
        <SettingsSheet
          globalSpeed={uiState.globalSpeedMult}
          inkWeight={uiState.inkWeight}
          showGuides={uiState.showGuides}
          showPoints={uiState.showPoints}
          onDismiss={() => engine.setActiveSheet(ActiveSheet.NONE)}
          onSpeedChange={engine.setGlobalSpeed}
          onWeightChange={engine.setInkWeight}
          onToggleGuides={engine.toggleGuides}
          onTogglePoints={engine.togglePoints}
          onClearDrawing={engine.clearDrawing}
          onZeroAngles={engine.zeroAngles}
        />
      )}

      {uiState.activeSheet === ActiveSheet.PRESETS && (
        <PresetsSheet
          savedPresets={uiState.savedPresets}
          onDismiss={() => engine.setActiveSheet(ActiveSheet.NONE)}
          onSelectCurated={engine.loadCuratedPreset}
          onSelectSaved={engine.loadSavedPreset}
          onDeleteSaved={engine.deleteSavedPreset}
          onOpenSaveDialog={() => engine.setShowSaveDialog(true)}
        />
      )}

      {uiState.activeSheet === ActiveSheet.LEARN && (
        <LearnSheet onDismiss={() => engine.setActiveSheet(ActiveSheet.NONE)} />
      )}

      {/* 5. Dialogs */}
      {uiState.showSaveDialog && (
        <SavePresetDialog
          circleCount={uiState.circles.length}
          onDismiss={() => engine.setShowSaveDialog(false)}
          onSave={engine.saveCurrentDesign}
        />
      )}

      {uiState.showExportDialog && (
        <ExportImageDialog
          strokes={visibleExportStrokes}
          title={uiState.currentPresetName}
          onDismiss={() => engine.setShowExportDialog(false)}
        />
      )}
    </main>
  );
}
