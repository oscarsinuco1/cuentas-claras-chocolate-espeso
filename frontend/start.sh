#!/bin/bash
npx serve dist -l tcp://0.0.0.0:${PORT:-3000} --single
