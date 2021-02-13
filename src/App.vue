<template>
  <canvas ref="renderCanvas" id="renderCanvas"></canvas>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {Web3DStudio }   from './web3DStudio'
export default defineComponent({
  name: "App",
  mounted(){
    let web3DStudio= new Web3DStudio(this.$refs.renderCanvas as HTMLCanvasElement)
  }
});
</script>

<style>
#renderCanvas {
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>